import { Briefcase, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/Button";
import { OpportunityCard, type OpportunityCardData } from "@/components/OpportunityCard";
import { OpportunityFilters } from "./OpportunityFilters";
import type { Judet } from "@/types/database";

export const metadata = { title: "Oportunități — ACDR" };

interface OpportunityRow extends Omit<OpportunityCardData, "company_denumire" | "company_slug" | "company_logo_url" | "judet_nume" | "raspunsuri"> {
  judete: { nume: string } | null;
  companies: { denumire: string; slug: string | null; logo_url: string | null } | null;
}

export default async function OportunitatiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const tip = params.tip ?? "";
  const judet = params.judet ?? "";

  const supabase = await createClient();
  const { t, locale } = await getT();
  const dateLocale = locale === "en" ? "en-US" : "ro-RO";

  const { data: judeteData } = await supabase.from("judete").select("cod, nume").order("nume");
  const judete = (judeteData as Judet[]) ?? [];

  let query = supabase
    .from("opportunities")
    .select(
      "id, titlu, tip, imagine_url, buget_min, buget_max, termen_limita, status, created_at, judete(nume), companies(denumire, slug, logo_url)"
    )
    .eq("status", "deschisa")
    .order("created_at", { ascending: false })
    .limit(60);

  if (tip) query = query.eq("tip", tip);
  if (judet) query = query.eq("judet_cod", judet);

  const { data } = await query;
  const randuri = (data as unknown as OpportunityRow[]) ?? [];

  let raspunsuriMap = new Map<string, number>();
  if (randuri.length > 0) {
    const { data: raspunsuriData } = await supabase
      .from("opportunity_responses")
      .select("opportunity_id")
      .in(
        "opportunity_id",
        randuri.map((r) => r.id)
      );
    const rows = (raspunsuriData as { opportunity_id: string }[]) ?? [];
    raspunsuriMap = rows.reduce((m, r) => m.set(r.opportunity_id, (m.get(r.opportunity_id) ?? 0) + 1), new Map<string, number>());
  }

  const oportunitati: OpportunityCardData[] = randuri.map((r) => ({
    id: r.id,
    titlu: r.titlu,
    tip: r.tip,
    imagine_url: r.imagine_url,
    judet_nume: r.judete?.nume ?? null,
    buget_min: r.buget_min,
    buget_max: r.buget_max,
    termen_limita: r.termen_limita,
    status: r.status,
    created_at: r.created_at,
    company_denumire: r.companies?.denumire ?? null,
    company_slug: r.companies?.slug ?? null,
    company_logo_url: r.companies?.logo_url ?? null,
    raspunsuri: raspunsuriMap.get(r.id) ?? 0,
  }));

  const cardLabels = {
    proiect: t.opportunities.typeProject,
    achizitie: t.opportunities.typePurchase,
    colaborare: t.opportunities.typeCollaboration,
    cerere_servicii: t.opportunities.typeServiceRequest,
    closed: t.opportunities.closed,
    responseSingular: t.opportunities.responseSingular,
    responses: t.opportunities.responses,
    companyFallback: t.opportunities.companyFallback,
    until: t.opportunities.until,
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="stamp-label text-seal">{t.opportunities.eyebrow}</p>
          <h1 className="mt-2 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            <Briefcase className="h-7 w-7 text-seal" strokeWidth={1.8} />
            {t.opportunities.title}
          </h1>
          <p className="mt-3 text-base text-ink-soft">{t.opportunities.subtitle}</p>
        </div>
        <LinkButton href="/oportunitati/noua" variant="seal" size="md" className="shrink-0">
          {t.opportunities.postNew}
        </LinkButton>
      </div>

      <OpportunityFilters
        judete={judete}
        labels={{
          filterAll: t.opportunities.filterAll,
          typeProject: t.opportunities.typeProject,
          typePurchase: t.opportunities.typePurchase,
          typeCollaboration: t.opportunities.typeCollaboration,
          typeServiceRequest: t.opportunities.typeServiceRequest,
        }}
      />

      {oportunitati.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/5 ring-1 ring-inset ring-line">
            <Inbox className="h-6 w-6 text-ink-soft/50" strokeWidth={1.6} />
          </div>
          <p className="mt-4 font-semibold text-ink">{t.opportunities.empty}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {oportunitati.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} labels={cardLabels} dateLocale={dateLocale} />
          ))}
        </div>
      )}
    </div>
  );
}
