import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Handshake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Card";
import { DealTerms } from "@/components/deal/DealTerms";
import { DealChat } from "@/components/deal/DealChat";
import type { Deal, DealMessage, DealVersion } from "@/types/database";

const STATUS_ETICHETA: Record<string, { text: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  draft: { text: "Ciornă", tone: "neutral" },
  negociere: { text: "În negociere", tone: "warning" },
  acceptat: { text: "Termeni acceptați", tone: "success" },
  finalizat: { text: "Finalizată", tone: "success" },
  anulat: { text: "Anulată", tone: "danger" },
};

export default async function IntelegerePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS ne lasa sa vedem doar intelegerile la care participam.
  const { data: dealData } = await supabase.from("deals").select("*").eq("id", id).maybeSingle();
  if (!dealData) notFound();
  const deal = dealData as Deal;

  const [{ data: versiuniData }, { data: mesajeData }, { data: firmeData }, { data: firmeleMele }] =
    await Promise.all([
      supabase.from("deal_versions").select("*").eq("deal_id", id).order("numar", { ascending: false }),
      supabase
        .from("deal_messages")
        .select("id, deal_id, sender_company_id, continut, sistem, citit, created_at")
        .eq("deal_id", id)
        .order("created_at"),
      supabase
        .from("companies")
        .select("id, slug, denumire")
        .in("id", [deal.company_a_id, deal.company_b_id]),
      supabase.from("companies").select("id").eq("owner_id", user.id).eq("status", "approved"),
    ]);

  const versiuni = (versiuniData as DealVersion[]) ?? [];
  const mesaje = (mesajeData as DealMessage[]) ?? [];
  const firme = (firmeData as { id: string; slug: string | null; denumire: string }[]) ?? [];
  const idFirmeleMele = ((firmeleMele as { id: string }[] | null) ?? []).map((f) => f.id);

  const firmaMeaId = idFirmeleMele.find((f) => f === deal.company_a_id || f === deal.company_b_id);
  if (!firmaMeaId) notFound();

  const numeFirme: Record<string, string> = {};
  firme.forEach((f) => (numeFirme[f.id] = f.denumire));

  const cealalta = firme.find((f) => f.id !== firmaMeaId);

  // Domeniul principal al celeilalte firme — pentru clauzele potrivite pe categorie
  let categoryId: string | null = null;
  if (cealalta) {
    const { data: cat } = await supabase
      .from("company_categories")
      .select("category_id, categories(parent_id)")
      .eq("company_id", cealalta.id)
      .eq("is_primary", true)
      .maybeSingle();
    const rand = cat as { category_id: string; categories: { parent_id: string | null } | null } | null;
    // Clauzele sunt legate de categoriile principale, deci urcam la parinte
    categoryId = rand?.categories?.parent_id ?? rand?.category_id ?? null;
  }

  const eticheta = STATUS_ETICHETA[deal.status] ?? STATUS_ETICHETA.draft;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Contul meu
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="stamp-label text-seal">Înțelegere</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {deal.titlu}
          </h1>
          {cealalta && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
              <Handshake className="h-4 w-4" />
              cu{" "}
              <Link
                href={`/firma/${cealalta.slug ?? cealalta.id}`}
                className="font-semibold text-ink hover:text-seal"
              >
                {cealalta.denumire}
              </Link>
            </p>
          )}
        </div>
        <Badge tone={eticheta.tone}>{eticheta.text}</Badge>
      </div>

      {/* Notă de context — documentul NU e un contract cu valoare juridică */}
      <div className="mt-5 rounded-xl bg-ink/4 p-3.5 text-xs leading-relaxed text-ink-soft ring-1 ring-inset ring-line">
        Aici stabiliți termenii colaborării, în scris și cu istoric. Documentul rezultat e un
        <strong className="text-ink"> rezumat al înțelegerii</strong> — util ca bază de discuție și
        pentru contabil sau jurist, dar <strong className="text-ink">nu ține loc de contract</strong> semnat.
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <DealTerms
          deal={deal}
          versiuni={versiuni}
          firmaMeaId={firmaMeaId}
          numeFirme={numeFirme}
          categoryId={categoryId}
        />

        <div className="lg:sticky lg:top-24">
          <DealChat
            dealId={id}
            firmaMeaId={firmaMeaId}
            numeFirme={numeFirme}
            mesajeInitiale={mesaje}
          />
        </div>
      </div>
    </div>
  );
}
