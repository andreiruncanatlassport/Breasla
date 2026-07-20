"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reply, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Field";

export function RfqResponseForm({ rfqId }: { rfqId: string }) {
  const router = useRouter();
  const [mesaj, setMesaj] = useState("");
  const [pret, setPret] = useState("");
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function trimite() {
    if (!mesaj.trim()) {
      setEroare("Scrie un mesaj.");
      return;
    }
    setSeTrimite(true);
    setEroare(null);
    try {
      const res = await fetch(`/api/rfq/${rfqId}/raspuns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaj, pret_estimat: pret ? Number(pret) : null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      setMesaj("");
      setPret("");
      router.refresh();
    } finally {
      setSeTrimite(false);
    }
  }

  return (
    <Card variant="raised" className="border-seal/30">
      <div className="flex items-center gap-2">
        <Reply className="h-4 w-4 text-seal" />
        <p className="font-semibold text-ink">Răspunde la această cerere</p>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <Label required>Mesajul tău</Label>
          <Textarea
            value={mesaj}
            onChange={(e) => setMesaj(e.target.value)}
            placeholder="Cum poți ajuta, ce include oferta, ce ai nevoie să știi în plus..."
          />
        </div>
        <div className="sm:w-56">
          <Label>Preț estimat (lei, opțional)</Label>
          <Input
            type="number"
            min={0}
            value={pret}
            onChange={(e) => setPret(e.target.value)}
            className="font-mono-num"
          />
        </div>

        <FieldError>{eroare}</FieldError>

        <Button variant="seal" onClick={trimite} disabled={seTrimite}>
          {seTrimite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />}
          Trimite răspunsul
        </Button>
      </div>
    </Card>
  );
}
