"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AdminOpportunityActions({
  opportunityId,
  status,
}: {
  opportunityId: string;
  status: "in_asteptare" | "deschisa" | "respinsa" | "inchisa";
}) {
  const router = useRouter();
  const [seIncarca, setSeIncarca] = useState(false);

  async function seteaza(status: string) {
    setSeIncarca(true);
    try {
      const res = await fetch(`/api/admin/oportunitati/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        alert(json?.error ?? "Nu am putut actualiza oportunitatea.");
        return;
      }
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      {status === "in_asteptare" && (
        <>
          <Button size="sm" variant="seal" onClick={() => seteaza("deschisa")} disabled={seIncarca}>
            {seIncarca ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Aprobă
          </Button>
          <Button size="sm" variant="danger" onClick={() => seteaza("respinsa")} disabled={seIncarca}>
            <X className="h-3.5 w-3.5" />
            Respinge
          </Button>
        </>
      )}
      {status !== "in_asteptare" && (
        <Button size="sm" variant="secondary" onClick={() => seteaza("in_asteptare")} disabled={seIncarca}>
          <RotateCcw className="h-3.5 w-3.5" />
          Trimite la revizuire
        </Button>
      )}
    </div>
  );
}
