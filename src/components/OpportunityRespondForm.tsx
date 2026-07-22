"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Label, Textarea, Input, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface Labels {
  prompt: string;
  estimatedPrice: string;
  placeholder: string;
  respond: string;
  respondError: string;
}

export function OpportunityRespondForm({ opportunityId, labels }: { opportunityId: string; labels: Labels }) {
  const router = useRouter();
  const [mesaj, setMesaj] = useState("");
  const [pret, setPret] = useState("");
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [trimis, setTrimis] = useState(false);

  async function trimite() {
    if (!mesaj.trim()) {
      setEroare(labels.respondError);
      return;
    }
    setLoading(true);
    setEroare(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaj, pret_estimat: pret ? Number(pret) : null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut trimite răspunsul.");
        return;
      }
      setTrimis(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (trimis) {
    return <p className="block-inset p-5 text-center text-sm font-medium text-teal">✓ Răspunsul tău a fost trimis.</p>;
  }

  return (
    <div className="block-inset p-5">
      <p className="stamp-label mb-3 text-ink-soft">{labels.prompt}</p>
      <div className="space-y-3">
        <div>
          <Label>{labels.estimatedPrice}</Label>
          <Input type="number" min={0} value={pret} onChange={(e) => setPret(e.target.value)} className="max-w-[180px]" />
        </div>
        <div>
          <Textarea value={mesaj} onChange={(e) => setMesaj(e.target.value)} placeholder={labels.placeholder} className="min-h-[100px]" />
        </div>
        <FieldError>{eroare}</FieldError>
        <Button variant="seal" onClick={trimite} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {labels.respond}
        </Button>
      </div>
    </div>
  );
}
