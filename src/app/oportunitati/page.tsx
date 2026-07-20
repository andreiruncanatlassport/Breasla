import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/Button";
import { OpportunityCard } from "@/components/OpportunityCard";
import type { Judet } from "@/types/database";

export const metadata = { title: "Oportunități — Rețeaua Antreprenorilor Creștini" };

interface OpportunityRow {
  id: string;
  titlu: string;
  descriere: string;
  tip: string;
  judet_cod: string | null;
  buget_min: number | null;
  buget_max: number | null;
  termen_limita: string | null;
  status: string;
  created_at: string;
  companies: { denumire: string } | null;
}

export default async function OportunitatiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: judeteData } = await supabase.from("judete").select("cod, nume").order("nume");
  const judete = (judeteData as Judet[]) ?? [];
  const judeteMap = new Map(judete.map((j) => [j.cod, j.nume]));

  let query = supabase
    .from("opportunities")
    .select(
      "id, titlu, descriere, tip, judet_cod, buget_min, buget_max, termen_limita, status, created_at, companies(denumire)"
    )
    .eq("status", "deschisa")
    .order("created_at", { ascending: false })
    .limit(60);

  if (params.tip) query = query.eq("tip", params.tip);
  if (params.judet) query = query.eq("judet_cod", params.judet);

  const { data } = await query;
  const oportunitati = (data as unknown as OpportunityRow[]) ?? [];

  const opportunityIds = oportunitati.map((o) => o.id);
  const raspunsuriMap = new Map<string, number>();
  if (opportunityIds.length > 0) {
    const { data: raspunsuriData } = await supabase
      .from("opportunity_responses")
      .select("opportunity_id")
      .in("opportunity_id", opportunityIds);
    for (const r of (raspunsuriData as { opportunity_id: string }[]) ?? []) {
      raspunsuriMap.set(r.opportunity_id, (raspunsuriMap.get(r.opportunity_id) ?? 0) + 1);
    }
  }

  const TIPURI = [
    { id: "", label: "Toate" },
    { id: "proiect", label: "Proiecte" },
    { id: "achizitie", label: "Achiziții" },
    { id: "colaborare", label: "Colaborări" },
    { id: "cerere_servicii", label: "Cereri de servicii" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="stamp-label text-seal">Board public</p>
          <h1 className="mt-2 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            <Briefcase className="h-7 w-7 text-seal" strokeWidth={1.8} />
            Oportunități
          </h1>
          <p className="mt-3 text-base text-ink-soft">
            Proiecte, achiziții, colaborări și cereri de servicii postate de membri. Orice firmă verificată poate răspunde.
          </p>
        </div>
        <LinkButton href="/oportunitati/noua" variant="seal">
          <Plus className="h-4 w-4" /> Postează o oportunitate
        </LinkButton>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {TIPURI.map((t) => (
          <Link
            key={t.id}
            href={t.id ? `/oportunitati?tip=${t.id}` : "/oportunitati"}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              (params.tip ?? "") === t.id
                ? "border-seal bg-seal/10 text-seal"
                : "border-line text-ink-soft hover:border-seal/40 hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {oportunitati.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">Nicio oportunitate deschisă momentan.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {oportunitati.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={{
                ...o,
                judet_nume: o.judet_cod ? judeteMap.get(o.judet_cod) ?? null : null,
                company_denumire: o.companies?.denumire ?? null,
                raspunsuri_count: raspunsuriMap.get(o.id) ?? 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
