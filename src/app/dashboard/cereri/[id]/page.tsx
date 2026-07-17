import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Wallet, MapPin, Send, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, SectionLabel } from "@/components/ui/Card";
import { RfqResponseForm } from "@/components/RfqResponseForm";
import { StartDealButton } from "@/components/deal/StartDealButton";
import type { Rfq } from "@/types/database";

export default async function CerereDetaliuPage({
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

  // RLS se ocupa de acces: vezi cererea doar daca esti autorul sau destinatar.
  const { data: rfqData } = await supabase.from("rfqs").select("*").eq("id", id).maybeSingle();
  if (!rfqData) notFound();
  const rfq = rfqData as Rfq;

  const [{ data: firmeleMele }, { data: destinatariData }, { data: raspunsuriData }, { data: autorData }] =
    await Promise.all([
      supabase.from("companies").select("id").eq("owner_id", user.id).eq("status", "approved"),
      supabase.from("rfq_recipients").select("company_id, companies(id, slug, denumire)").eq("rfq_id", id),
      supabase
        .from("rfq_responses")
        .select("id, mesaj, pret_estimat, created_at, companies(id, slug, denumire)")
        .eq("rfq_id", id)
        .order("created_at"),
      supabase.from("companies").select("id, slug, denumire").eq("id", rfq.requester_company_id).maybeSingle(),
    ]);

  const idFirmeleMele = ((firmeleMele as { id: string }[] | null) ?? []).map((f) => f.id);
  const destinatari =
    (destinatariData as unknown as { company_id: string; companies: { id: string; slug: string | null; denumire: string } | null }[]) ?? [];
  const raspunsuri =
    (raspunsuriData as unknown as { id: string; mesaj: string; pret_estimat: number | null; created_at: string; companies: { id: string; slug: string | null; denumire: string } | null }[]) ?? [];
  const autor = autorData as { id: string; slug: string | null; denumire: string } | null;

  const suntAutor = idFirmeleMele.includes(rfq.requester_company_id);
  const firmaMeaDestinatara = destinatari.find((d) => idFirmeleMele.includes(d.company_id));
  const amRaspunsDeja = raspunsuri.some((r) => r.companies && idFirmeleMele.includes(r.companies.id));

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Contul meu
      </Link>

      <Card variant="raised" className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="stamp-label text-seal">Cerere de ofertă</p>
            <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
              {rfq.titlu}
            </h1>
            {autor && (
              <p className="mt-1.5 text-sm text-ink-soft">
                de la{" "}
                <Link href={`/firma/${autor.slug ?? autor.id}`} className="font-medium text-ink hover:text-seal">
                  {autor.denumire}
                </Link>
              </p>
            )}
          </div>
          <Badge tone={rfq.status === "deschis" ? "success" : "neutral"}>
            {rfq.status === "deschis" ? "Deschisă" : rfq.status === "inchis" ? "Închisă" : "Anulată"}
          </Badge>
        </div>

        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
          {rfq.descriere}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(rfq.buget_min || rfq.buget_max) && (
            <Badge tone="neutral">
              <Wallet className="h-3 w-3" />
              {rfq.buget_min?.toLocaleString("ro-RO") ?? "?"} – {rfq.buget_max?.toLocaleString("ro-RO") ?? "?"} lei
            </Badge>
          )}
          {rfq.termen_limita && (
            <Badge tone="neutral">
              <Calendar className="h-3 w-3" />
              {new Date(rfq.termen_limita).toLocaleDateString("ro-RO")}
            </Badge>
          )}
          {rfq.judet_cod && (
            <Badge tone="neutral">
              <MapPin className="h-3 w-3" /> {rfq.judet_cod}
            </Badge>
          )}
        </div>
      </Card>

      {/* Raspunde — doar daca esti destinatar si n-ai raspuns deja */}
      {firmaMeaDestinatara && !amRaspunsDeja && rfq.status === "deschis" && (
        <div className="mt-6">
          <RfqResponseForm rfqId={id} />
        </div>
      )}

      {/* Autorul vede cui a trimis */}
      {suntAutor && (
        <div className="mt-8">
          <SectionLabel icon={<Send className="h-3.5 w-3.5" />}>
            Trimisă către ({destinatari.length})
          </SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {destinatari.map((d) =>
              d.companies ? (
                <Link
                  key={d.company_id}
                  href={`/firma/${d.companies.slug ?? d.companies.id}`}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-seal hover:text-ink"
                >
                  {d.companies.denumire}
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Raspunsuri */}
      <div className="mt-8">
        <SectionLabel icon={<Inbox className="h-3.5 w-3.5" />}>
          Răspunsuri ({raspunsuri.length})
        </SectionLabel>

        <div className="mt-3 space-y-3">
          {raspunsuri.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-soft">
              Niciun răspuns încă.
            </p>
          )}
          {raspunsuri.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {r.companies && (
                  <Link
                    href={`/firma/${r.companies.slug ?? r.companies.id}`}
                    className="text-sm font-semibold text-ink hover:text-seal"
                  >
                    {r.companies.denumire}
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  {r.pret_estimat != null && (
                    <Badge tone="success">
                      <span className="font-mono-num">{r.pret_estimat.toLocaleString("ro-RO")} lei</span>
                    </Badge>
                  )}
                  <span className="font-mono-num text-xs text-ink-soft/70">
                    {new Date(r.created_at).toLocaleDateString("ro-RO")}
                  </span>
                </div>
              </div>
              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                {r.mesaj}
              </p>

              {/* Pasul urmator: din raspuns -> intelegere cu chat si termeni */}
              {suntAutor && r.companies && rfq.status === "deschis" && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="text-xs text-ink-soft">
                    Vă convine oferta? Continuați cu stabilirea termenilor.
                  </p>
                  <StartDealButton
                    companyBId={r.companies.id}
                    titlu={rfq.titlu}
                    rfqId={rfq.id}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
