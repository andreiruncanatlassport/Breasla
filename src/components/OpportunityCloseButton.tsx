"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Unlock, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OpportunityStatus } from "@/types/database";

export function OpportunityCloseButton({
  opportunityId,
  status,
  labels,
}: {
  opportunityId: string;
  status: OpportunityStatus;
  labels: { close: string; reopen: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // In asteptare / respinsa nu sunt stari intre care proprietarul poate comuta
  // singur (le seteaza doar admin, la moderare) — aici doar informam.
  if (status === "in_asteptare") {
    return (
      <p className="flex items-center gap-1.5 text-sm text-ink-soft">
        <Clock className="h-3.5 w-3.5" /> În așteptare — un administrator o va analiza în curând.
      </p>
    );
  }
  if (status === "respinsa") {
    return (
      <p className="flex items-center gap-1.5 text-sm text-ink-soft">
        <XCircle className="h-3.5 w-3.5" /> Respinsă de un administrator.
      </p>
    );
  }

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "deschisa" ? "inchisa" : "deschisa" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={toggle} disabled={loading}>
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === "deschisa" ? (
        <Lock className="h-3.5 w-3.5" />
      ) : (
        <Unlock className="h-3.5 w-3.5" />
      )}
      {status === "deschisa" ? labels.close : labels.reopen}
    </Button>
  );
}
