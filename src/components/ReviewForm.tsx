"use client";

import { useState } from "react";
import { Star, Paperclip, Loader2 } from "lucide-react";
import { incarcaDovadaRecenzie } from "@/lib/upload";
import { Button } from "@/components/ui/Button";
import { Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export function ReviewForm({
  reviewedCompanyId,
  reviewerCompanyId,
}: {
  reviewedCompanyId: string;
  reviewerCompanyId: string;
}) {
  const [rating, setRating] = useState(5);
  const [comentariu, setComentariu] = useState("");
  const [fisier, setFisier] = useState<File | null>(null);
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [trimis, setTrimis] = useState(false);

  async function trimite() {
    if (!fisier) {
      setEroare("Atașează o dovadă a colaborării (contract, comandă, email etc.).");
      return;
    }
    setSeTrimite(true);
    setEroare(null);
    try {
      const { path } = await incarcaDovadaRecenzie(reviewerCompanyId, fisier);
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewed_company_id: reviewedCompanyId,
          rating,
          comentariu,
          dovada_url: path,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      setTrimis(true);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la trimitere.");
    } finally {
      setSeTrimite(false);
    }
  }

  if (trimis) {
    return (
      <Card className="border-teal/30 bg-teal/5 text-sm text-teal">
        Mulțumim! Recenzia ta a intrat în verificare și va fi publicată după aprobare.
      </Card>
    );
  }

  return (
    <Card>
      <p className="font-medium text-ink">Lasă o recenzie</p>
      <FieldHint>
        Necesită o dovadă a colaborării (contract, comandă, corespondență) — vizibilă doar
        administratorilor, pentru verificare.
      </FieldHint>

      <div className="mt-3 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} type="button" onClick={() => setRating(i + 1)}>
            <Star className={`h-6 w-6 ${i < rating ? "fill-seal text-seal" : "text-ink/20"}`} />
          </button>
        ))}
      </div>

      <Textarea
        className="mt-3"
        placeholder="Cum a fost colaborarea?"
        value={comentariu}
        onChange={(e) => setComentariu(e.target.value)}
      />

      <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink-soft hover:border-seal">
        <Paperclip className="h-4 w-4" />
        {fisier ? fisier.name : "Atașează dovada colaborării"}
        <input
          type="file"
          className="hidden"
          onChange={(e) => setFisier(e.target.files?.[0] ?? null)}
        />
      </label>

      <FieldError>{eroare}</FieldError>

      <Button size="sm" className="mt-3" onClick={trimite} disabled={seTrimite}>
        {seTrimite ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Trimite recenzia
      </Button>
    </Card>
  );
}
