"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea, Input, Label } from "@/components/ui/Field";
import { useSettings } from "@/lib/settings/context";

export function OpportunityRespondForm({
  opportunityId,
  autentificat,
  areFirma,
  aRaspunsDeja,
}: {
  opportunityId: string;
  autentificat: boolean;
  areFirma: boolean;
  aRaspunsDeja: boolean;
}) {
  const router = useRouter();
  const { t } = useSettings();
  const [mesaj, setMesaj] = useState("");
  const [pret, setPret] = useState("");
  const [trimis, setTrimis] = useState(aRaspunsDeja);
  const [loading, setLoading] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  if (!autentificat) {
    return (
      <div className="block-inset p-5 text-center">
        <p className="text-sm text-ink-soft">
          <Link href="/login" className="font-semibold text-seal hover:underline">
            {t.opportunities.loginLink}
          </Link>{" "}
          {t.opportunities.loginToRespondSuffix}
        </p>
      </div>
    );
  }

  if (!areFirma) {
    return (
      <div className="block-inset p-5 text-center">
        <p className="text-sm text-ink-soft">
          {t.opportunities.needCompany}{" "}
          <Link href="/inregistrare/firma" className="font-semibold text-seal hover:underline">
            {t.opportunities.registerLink}
          </Link>
          .
        </p>
      </div>
    );
  }

  if (trimis) {
    return (
      <div className="block-inset flex items-center gap-2.5 p-5 text-sm text-teal">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {t.opportunities.alreadyRespondedContact}
      </div>
    );
  }

  async function trimite() {
    if (!mesaj.trim()) {
      setEroare(t.opportunities.respondError);
      return;
    }
    setLoading(true);
    setEroare(null);
    try {
      const res = await fetch(`/api/oportunitati/${opportunityId}/raspuns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaj: mesaj.trim(), pret_estimat: pret ? Number(pret) : null }),
      });
      const json = await res.json();
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

  return (
    <div className="block-base p-5">
      <p className="stamp-label mb-3 text-ink-soft">{t.opportunities.respondPrompt}</p>
      <Textarea value={mesaj} onChange={(e) => setMesaj(e.target.value)} placeholder={t.opportunities.responsePlaceholder} />
      <div className="mt-3 max-w-[200px]">
        <Label>{t.opportunities.estimatedPrice}</Label>
        <Input type="number" min={0} value={pret} onChange={(e) => setPret(e.target.value)} />
      </div>
      {eroare && <p className="mt-2 text-xs font-medium text-rust">{eroare}</p>}
      <Button variant="seal" onClick={trimite} disabled={loading} className="mt-4">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t.opportunities.respond}
      </Button>
    </div>
  );
}
