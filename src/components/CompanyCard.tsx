import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { Card, Badge } from "@/components/ui/Card";
import { VerifiedStamp } from "@/components/ui/VerifiedStamp";

export interface CompanyCardData {
  id: string;
  denumire: string;
  judet_nume: string | null;
  localitate: string | null;
  dimensiune_echipa: string | null;
  descriere: string | null;
  domeniu_principal: string | null;
  distanta_km?: number;
}

export function CompanyCard({ company }: { company: CompanyCardData }) {
  return (
    <Link href={`/firma/${company.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono-num text-[11px] uppercase tracking-wide text-ink/40">
              {company.domeniu_principal ?? "Firmă"}
            </p>
            <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug text-ink">
              {company.denumire}
            </h3>
          </div>
          <VerifiedStamp size="sm" className="shrink-0" />
        </div>

        {company.descriere && (
          <p className="mt-2 line-clamp-2 text-sm text-ink/60">{company.descriere}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/55">
          {(company.judet_nume || company.localitate) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {[company.localitate, company.judet_nume].filter(Boolean).join(", ")}
            </span>
          )}
          {company.dimensiune_echipa && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {company.dimensiune_echipa}
            </span>
          )}
          {typeof company.distanta_km === "number" && (
            <Badge tone="neutral">{company.distanta_km.toFixed(0)} km</Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
