"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/lib/settings/context";

export function EventRsvpButton({
  eventId,
  initialInscris,
  plin,
  autentificat,
}: {
  eventId: string;
  initialInscris: boolean;
  plin: boolean;
  autentificat: boolean;
}) {
  const router = useRouter();
  const { t } = useSettings();
  const [inscris, setInscris] = useState(initialInscris);
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function toggle() {
    if (!autentificat) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setEroare(null);
    try {
      const res = await fetch(`/api/evenimente/${eventId}/inscriere`, {
        method: inscris ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: inscris ? undefined : JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEroare(json?.error ?? "A apărut o eroare.");
        return;
      }
      setInscris(!inscris);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        variant={inscris ? "secondary" : "seal"}
        onClick={toggle}
        disabled={loading || (plin && !inscris)}
        className="w-full sm:w-auto"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : inscris ? (
          <CalendarX className="h-4 w-4" />
        ) : (
          <CalendarCheck className="h-4 w-4" />
        )}
        {inscris ? t.events.unregister : plin ? t.events.full : t.events.register}
      </Button>
      {eroare && <p className="mt-2 text-xs font-medium text-rust">{eroare}</p>}
    </div>
  );
}
