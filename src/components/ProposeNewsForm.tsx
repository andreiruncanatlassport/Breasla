"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Input, Label, Textarea, FieldError, FieldHint, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ProposeNewsForm() {
  const router = useRouter();
  const [titlu, setTitlu] = useState("");
  const [rezumat, setRezumat] = useState("");
  const [continut, setContinut] = useState("");
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [trimis, setTrimis] = useState(false);

  async function trimite() {
    if (!titlu.trim() || !continut.trim()) {
      setEroare("Titlul și conținutul sunt obligatorii.");
      return;
    }
    setSeTrimite(true);
    setEroare(null);
    try {
      const res = await fetch("/api/stiri/propune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titlu, rezumat, continut }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut trimite propunerea.");
        return;
      }
      setTrimis(true);
    } finally {
      setSeTrimite(false);
    }
  }

  if (trimis) {
    return (
      <div className="block-base flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-teal" />
        <p className="text-lg font-semibold text-ink">Propunere trimisă!</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Un administrator o va analiza și, dacă e potrivită, o va publica pe pagina de Știri.
        </p>
        <Button variant="secondary" onClick={() => router.push("/stiri")}>
          Înapoi la Știri
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FieldGroup>
        <div>
          <Label required>Titlu</Label>
          <Input value={titlu} onChange={(e) => setTitlu(e.target.value)} placeholder="Titlul știrii" />
        </div>
        <div>
          <Label>Rezumat (opțional)</Label>
          <Textarea
            value={rezumat}
            onChange={(e) => setRezumat(e.target.value)}
            maxLength={280}
            className="min-h-[70px]"
            placeholder="Câteva rânduri care rezumă știrea"
          />
        </div>
        <div>
          <Label required>Conținut</Label>
          <Textarea
            value={continut}
            onChange={(e) => setContinut(e.target.value)}
            className="min-h-[220px]"
            placeholder="Paragrafele se despart printr-o linie goală."
          />
        </div>
      </FieldGroup>

      <FieldHint>
        Propunerea ta ajunge doar la administratori — nu apare public decât dacă e aprobată și publicată.
      </FieldHint>

      <FieldError>{eroare}</FieldError>

      <Button variant="seal" onClick={trimite} disabled={seTrimite}>
        {seTrimite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Trimite propunerea
      </Button>
    </div>
  );
}
