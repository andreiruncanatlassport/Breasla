"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, Check } from "lucide-react";

export function EmailUnverifiedBanner({ email }: { email: string }) {
  const router = useRouter();
  const [codTrimis, setCodTrimis] = useState(false);
  const [cod, setCod] = useState("");
  const [seIncarca, setSeIncarca] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [verificat, setVerificat] = useState(false);

  async function trimiteCod() {
    setSeIncarca(true);
    setEroare(null);
    try {
      const res = await fetch("/api/verificare-email/trimite", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      setCodTrimis(true);
    } finally {
      setSeIncarca(false);
    }
  }

  async function confirmaCod() {
    setSeIncarca(true);
    setEroare(null);
    try {
      const res = await fetch("/api/verificare-email/confirma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cod }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      setVerificat(true);
      router.refresh();
    } finally {
      setSeIncarca(false);
    }
  }

  if (verificat) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm font-medium text-teal">
        <Check className="h-4 w-4" /> Email verificat. Mulțumim!
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-rust/30 bg-rust/8 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rust" />
          <p className="text-ink-soft">
            <span className="rounded-md bg-rust px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              Neverificat
            </span>{" "}
            Emailul <strong className="text-ink">{email}</strong> nu e verificat. Verificarea e
            opțională — contul funcționează normal fără ea.
          </p>
        </div>

        {!codTrimis && (
          <button
            onClick={trimiteCod}
            disabled={seIncarca}
            className="shrink-0 rounded-lg bg-rust px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {seIncarca ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verifică acum"}
          </button>
        )}
      </div>

      {codTrimis && (
        <div className="mt-3 pl-6.5">
          <p className="text-xs text-ink-soft">Ți-am trimis un cod pe email. Introdu-l aici:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={cod}
              onChange={(e) => setCod(e.target.value)}
              placeholder="Cod din 6 cifre"
              className="font-mono-num w-40 rounded-lg border border-line bg-paper-white px-3 py-1.5 text-sm text-ink outline-none focus:border-seal"
            />
            <button
              onClick={confirmaCod}
              disabled={seIncarca || !cod}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-content transition hover:brightness-110 disabled:opacity-50"
            >
              {seIncarca ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirmă"}
            </button>
            <button
              onClick={trimiteCod}
              disabled={seIncarca}
              className="px-2 text-xs font-medium text-ink-soft hover:text-ink"
            >
              Retrimite
            </button>
          </div>
        </div>
      )}

      {eroare && <p className="mt-2 pl-6.5 text-xs font-medium text-rust">{eroare}</p>}
    </div>
  );
}
