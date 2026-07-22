"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function OpportunityCloseButton({
  opportunityId,
  status,
  labels,
}: {
  opportunityId: string;
  status: "deschisa" | "inchisa";
  labels: { close: string; reopen: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
