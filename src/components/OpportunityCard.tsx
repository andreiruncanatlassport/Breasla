import Link from "next/link";
import { MapPin, Wallet, Clock, Building2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Card";

export interface OpportunityCardData {
  id: string;
  titlu: string;
  descriere: string;
  tip: string;
  judet_nume: string | null;
  buget_min: number | null;
  buget_max: number | null;
  termen_limita: string | null;
  status: string;
  created_at: string;
  company_denumire: string | null;
  raspunsuri_count?: number;
}

const TIP_LABEL: Record<string, string> = {
  proiect: "Proiect",
  achizitie: "Achiziție",
  colaborare: "Colaborare",
  cerere_servicii: "Cerere de servicii",
};

const TIP_TONE: Record<string, "seal" | "success" | "violet" | "neutral"> = {
  proiect: "seal",
  achizitie: "success",
  colaborare: "violet",
  cerere_servicii: "neutral",
};

function formateazaBuget(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `${Math.round(n).toLocaleString("ro-RO")} €`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

export function OpportunityCard({ opportunity }: { opportunity: OpportunityCardData }) {
  const buget = formateazaBuget(opportunity.buget_min, opportunity.buget_max);

  return (
    <Link href={`/oportunitati/${opportunity.id}`} className="group block h-full active:scale-[0.98] transition-transform duration-150">
      <article className="lift-on-hover block-base flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Badge tone={TIP_TONE[opportunity.tip] ?? "neutral"}>{TIP_LABEL[opportunity.tip] ?? opportunity.tip}</Badge>
          {opportunity.status === "inchisa" && <Badge tone="danger">Închisă</Badge>}
        </div>

        <h3 className="mt-3 font-display text-base font-semibold leading-snug text-ink">{opportunity.titlu}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-soft">{opportunity.descriere}</p>

        {opportunity.company_denumire && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-seal" />
            {opportunity.company_denumire}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          {buget && (
            <Badge tone="warning">
              <Wallet className="h-3 w-3" /> {buget}
            </Badge>
          )}
          {opportunity.judet_nume && (
            <Badge tone="neutral">
              <MapPin className="h-3 w-3" /> {opportunity.judet_nume}
            </Badge>
          )}
          {opportunity.termen_limita && (
            <Badge tone="neutral">
              <Clock className="h-3 w-3" />
              {new Date(opportunity.termen_limita).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" })}
            </Badge>
          )}
          {typeof opportunity.raspunsuri_count === "number" && opportunity.raspunsuri_count > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-seal">
              {opportunity.raspunsuri_count} răspuns{opportunity.raspunsuri_count === 1 ? "" : "uri"}
              <ArrowUpRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
