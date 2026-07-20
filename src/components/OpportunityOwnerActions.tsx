"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function OpportunityOwnerActions({ opportunityId, status }: { opportunityId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function schimbaStatus(nou: "deschisa" | "inchisa") {
    setLoading(true);
    try {
      await fetch(`/api/oportunitati/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nou }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => schimbaStatus(status === "deschisa" ? "inchisa" : "deschisa")}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === "deschisa" ? (
        <Lock className="h-3.5 w-3.5" />
      ) : (
        <Unlock className="h-3.5 w-3.5" />
      )}
      {status === "deschisa" ? "Închide oportunitatea" : "Redeschide"}
    </Button>
  );
}
