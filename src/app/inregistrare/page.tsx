"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StepCont } from "./steps/StepCont";
import { StepCui } from "./steps/StepCui";
import { StepDetalii } from "./steps/StepDetalii";
import { StepDomenii } from "./steps/StepDomenii";
import { StepNevoi } from "./steps/StepNevoi";
import { initialWizardState, type WizardFormState } from "./types";

const ETAPE = ["Cont", "CUI", "Detalii firmă", "Domenii", "Nevoi & trimitere"];

export default function InregistrarePage() {
  const [verificareSesiune, setVerificareSesiune] = useState(true);
  const [areCont, setAreCont] = useState(false);
  const [pas, setPas] = useState(0);
  const [form, setForm] = useState<WizardFormState>(initialWizardState);
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroareTrimitere, setEroareTrimitere] = useState<string | null>(null);
  const [rezultat, setRezultat] = useState<{ status: "approved" | "pending" } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const logat = Boolean(data.user);
      setAreCont(logat);
      setPas(logat ? 1 : 0);
      setVerificareSesiune(false);
    });
  }, []);

  function update(patch: Partial<WizardFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function trimite() {
    setSeTrimite(true);
    setEroareTrimitere(null);

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setEroareTrimitere(json.error || "A apărut o eroare. Încearcă din nou.");
        return;
      }

      setRezultat({ status: json.data.status });
    } catch {
      setEroareTrimitere("Nu am putut trimite datele. Verifică conexiunea și încearcă din nou.");
    } finally {
      setSeTrimite(false);
    }
  }

  if (verificareSesiune) {
    return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-ink/50">Se încarcă...</div>;
  }

  if (rezultat) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <Card>
          {rezultat.status === "approved" ? (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-teal" />
              <h1 className="mt-4 text-xl font-semibold text-ink">Firma ta e verificată!</h1>
              <p className="mt-2 text-sm text-ink/65">
                CUI-ul a fost validat automat la ANAF, iar profilul tău e deja vizibil în catalog.
              </p>
            </>
          ) : (
            <>
              <Clock className="mx-auto h-10 w-10 text-seal" />
              <h1 className="mt-4 text-xl font-semibold text-ink">Înregistrare primită</h1>
              <p className="mt-2 text-sm text-ink/65">
                Profilul tău a intrat în verificare manuală și va fi publicat de un administrator
                în curând.
              </p>
            </>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <LinkButton href="/dashboard" variant="primary">Vezi contul meu</LinkButton>
            <LinkButton href="/catalog" variant="secondary">Explorează catalogul</LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-2xl font-semibold text-ink">Înregistrează-ți firma</h1>
      <p className="mt-1.5 text-sm text-ink/60">
        Îți ia câteva minute. Preluăm automat datele oficiale de la ANAF.
      </p>

      {/* progres */}
      <div className="mt-6 flex gap-1.5">
        {ETAPE.map((eticheta, i) => (
          <div key={eticheta} className="flex-1">
            <div className={"h-1.5 rounded-full " + (i <= pas ? "bg-seal" : "bg-line")} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink/40">{ETAPE[pas]}</p>

      <Card className="mt-6">
        {pas === 0 && <StepCont onDone={() => { setAreCont(true); setPas(1); }} />}
        {pas === 1 && (
          <StepCui
            form={form}
            update={update}
            onNext={() => setPas(2)}
            onBack={() => setPas(areCont ? 1 : 0)}
          />
        )}
        {pas === 2 && (
          <StepDetalii form={form} update={update} onNext={() => setPas(3)} onBack={() => setPas(1)} />
        )}
        {pas === 3 && (
          <StepDomenii form={form} update={update} onNext={() => setPas(4)} onBack={() => setPas(2)} />
        )}
        {pas === 4 && (
          <StepNevoi
            form={form}
            update={update}
            onBack={() => setPas(3)}
            onSubmit={trimite}
            seTrimite={seTrimite}
            eroareTrimitere={eroareTrimitere}
          />
        )}
      </Card>
    </div>
  );
}
