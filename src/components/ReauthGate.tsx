"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, FieldError, FieldHint } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export function ReauthGate({ children }: { children: ReactNode }) {
  const [seVerifica, setSeVerifica] = useState(true);
  const [valid, setValid] = useState(false);
  const [codTrimis, setCodTrimis] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [cod, setCod] = useState("");
  const [seIncarca, setSeIncarca] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function verificaStare() {
    setSeVerifica(true);
    const res = await fetch("/api/reauth/status");
    const json = await res.json();
    setValid(Boolean(json?.data?.valid));
    setSeVerifica(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verificaStare();
  }, []);

  async function trimiteCod() {
    setSeIncarca(true);
    setEroare(null);
    try {
      const res = await fetch("/api/reauth/send", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      setEmail(json.data.email);
      setCodTrimis(true);
    } finally {
      setSeIncarca(false);
    }
  }

  async function confirmaCod() {
    setSeIncarca(true);
    setEroare(null);
    try {
      const res = await fetch("/api/reauth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cod }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      setValid(true);
    } finally {
      setSeIncarca(false);
    }
  }

  if (seVerifica) {
    return <p className="text-sm text-ink-soft">Se verifică...</p>;
  }

  if (valid) {
    return <>{children}</>;
  }

  return (
    <Card className="border-seal/30 bg-seal/5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-seal" />
        <div className="w-full">
          <p className="font-medium text-ink">Confirmă-ți identitatea</p>
          <p className="mt-1 text-sm text-ink-soft">
            Din motive de siguranță, îți cerem să reconfirmi emailul înainte de a edita sau șterge
            profilul firmei.
          </p>

          {!codTrimis ? (
            <Button size="sm" className="mt-3" onClick={trimiteCod} disabled={seIncarca}>
              {seIncarca ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Trimite cod pe email
            </Button>
          ) : (
            <div className="mt-3 max-w-xs">
              <FieldHint>Am trimis un cod la {email}. Introdu-l mai jos.</FieldHint>
              <div className="mt-2 flex gap-2">
                <Input
                  value={cod}
                  onChange={(e) => setCod(e.target.value)}
                  placeholder="Cod din 6 cifre"
                  className="font-mono-num"
                />
                <Button size="sm" onClick={confirmaCod} disabled={seIncarca || !cod}>
                  Confirmă
                </Button>
              </div>
              <button
                type="button"
                onClick={trimiteCod}
                className="mt-2 text-xs font-medium text-seal hover:underline"
                disabled={seIncarca}
              >
                Retrimite codul
              </button>
            </div>
          )}

          <FieldError>{eroare}</FieldError>
        </div>
      </div>
    </Card>
  );
}
