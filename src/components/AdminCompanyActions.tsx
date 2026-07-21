"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AdminCompanyActions({
  companyId,
  actiuniDisponibile,
  potSterge,
}: {
  companyId: string;
  actiuniDisponibile: Array<"approve" | "reject" | "suspend">;
  potSterge?: boolean;
}) {
  const router = useRouter();
  const [seIncarca, setSeIncarca] = useState(false);

  async function ruleaza(actiune: "approve" | "reject" | "suspend") {
    let motiv: string | null = null;
    if (actiune === "reject") {
      motiv = window.prompt("Motivul respingerii (vizibil doar în jurnalul admin):") ?? "";
    }
    setSeIncarca(true);
    try {
      await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actiune, motiv }),
      });
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  async function sterge() {
    if (!confirm("Ștergi definitiv această firmă? Acțiunea e ireversibilă.")) return;
    setSeIncarca(true);
    try {
      const res = await fetch(`/api/admin/companies?id=${companyId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        alert(json?.error ?? "Nu am putut șterge firma.");
        return;
      }
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      {actiuniDisponibile.includes("approve") && (
        <Button size="sm" onClick={() => ruleaza("approve")} disabled={seIncarca}>Aprobă</Button>
      )}
      {actiuniDisponibile.includes("reject") && (
        <Button size="sm" variant="danger" onClick={() => ruleaza("reject")} disabled={seIncarca}>Respinge</Button>
      )}
      {actiuniDisponibile.includes("suspend") && (
        <Button size="sm" variant="secondary" onClick={() => ruleaza("suspend")} disabled={seIncarca}>Suspendă</Button>
      )}
      {potSterge && (
        <Button size="sm" variant="danger" onClick={sterge} disabled={seIncarca} aria-label="Șterge firma">
          {seIncarca ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}
