"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Field";
import type { Judet } from "@/types/database";

interface Props {
  judete: Judet[];
  labels: {
    filterAll: string;
    typeProject: string;
    typePurchase: string;
    typeCollaboration: string;
    typeServiceRequest: string;
  };
}

const TIPURI = [
  { id: "", key: "filterAll" as const },
  { id: "proiect", key: "typeProject" as const },
  { id: "achizitie", key: "typePurchase" as const },
  { id: "colaborare", key: "typeCollaboration" as const },
  { id: "cerere_servicii", key: "typeServiceRequest" as const },
];

export function OpportunityFilters({ judete, labels }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tip = searchParams.get("tip") ?? "";
  const judet = searchParams.get("judet") ?? "";

  function seteaza(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    router.push(qs ? `/oportunitati?${qs}` : "/oportunitati");
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2.5">
      <div className="flex flex-wrap gap-1.5">
        {TIPURI.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => seteaza({ tip: opt.id || null })}
            className={
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition " +
              (tip === opt.id
                ? "border-seal bg-seal text-white"
                : "border-line text-ink-soft hover:border-seal/40 hover:text-ink")
            }
          >
            {labels[opt.key]}
          </button>
        ))}
      </div>

      <div className="ml-auto w-40 shrink-0">
        <Select value={judet} onChange={(e) => seteaza({ judet: e.target.value || null })}>
          <option value="">Toate județele</option>
          {judete.map((j) => (
            <option key={j.cod} value={j.cod}>
              {j.nume}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
