"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function RecommendButton({
  membruId,
  aRecomandatDeja,
  autentificat,
}: {
  membruId: string;
  aRecomandatDeja: boolean;
  autentificat: boolean;
}) {
  const router = useRouter();
  const [recomandat, setRecomandat] = useState(aRecomandatDeja);
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function comuta() {
    if (!autentificat) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setEroare(null);
    try {
      if (recomandat) {
        await fetch(`/api/recomandari?id=${membruId}`, { method: "DELETE" });
        setRecomandat(false);
      } else {
        const res = await fetch("/api/recomandari", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommended_id: membruId }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setEroare(json?.error ?? "Nu am putut trimite recomandarea.");
          return;
        }
        setRecomandat(true);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button variant={recomandat ? "secondary" : "seal"} onClick={comuta} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : recomandat ? (
          <Check className="h-4 w-4" />
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
        {recomandat ? "Recomandat de tine" : "Recomandă"}
      </Button>
      {eroare && <p className="max-w-xs text-center text-xs font-medium text-rust">{eroare}</p>}
    </div>
  );
}
