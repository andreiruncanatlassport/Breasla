"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * "Treci mai departe" — transforma un raspuns la o cerere de oferta intr-o
 * intelegere cu chat si negociere de termeni. Fara asta, fluxul se opreste
 * la primul raspuns.
 */
export function StartDealButton({
  companyBId,
  titlu,
  rfqId,
}: {
  companyBId: string;
  titlu: string;
  rfqId?: string;
}) {
  const router = useRouter();
  const [seIncarca, setSeIncarca] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function porneste() {
    setSeIncarca(true);
    setEroare(null);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titlu, company_b_id: companyBId, rfq_id: rfqId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      router.push(`/dashboard/intelegeri/${json.data.id}`);
    } finally {
      setSeIncarca(false);
    }
  }

  return (
    <div>
      <Button size="sm" variant="seal" onClick={porneste} disabled={seIncarca}>
        {seIncarca ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
        Treci mai departe
      </Button>
      {eroare && <p className="mt-1.5 text-xs font-medium text-rust">{eroare}</p>}
    </div>
  );
}
