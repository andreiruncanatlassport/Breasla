"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function AdminCompanyActions({
  companyId,
  actiuniDisponibile,
}: {
  companyId: string;
  actiuniDisponibile: Array<"approve" | "reject" | "suspend">;
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

  return (
    <div className="flex gap-2">
      {actiuniDisponibile.includes("approve") && (
        <Button size="sm" onClick={() => ruleaza("approve")} disabled={seIncarca}>Aprobă</Button>
      )}
      {actiuniDisponibile.includes("reject") && (
        <Button size="sm" variant="danger" onClick={() => ruleaza("reject")} disabled={seIncarca}>Respinge</Button>
      )}
      {actiuniDisponibile.includes("suspend") && (
        <Button size="sm" variant="secondary" onClick={() => ruleaza("suspend")} disabled={seIncarca}>Suspendă</Button>
      )}
    </div>
  );
}
