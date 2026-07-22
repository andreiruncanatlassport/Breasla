"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { SkeletonPage } from "@/components/ui/Skeleton";
import { LinkButton } from "@/components/ui/Button";
import { StepCui } from "../steps/StepCui";
import { StepDetalii } from "../steps/StepDetalii";
import { StepDomenii } from "../steps/StepDomenii";
import { StepNevoi } from "../steps/StepNevoi";
import { initialWizardState, type WizardFormState } from "../types";

const ETAPE = ["CUI", "Detalii firmă", "Domenii", "Nevoi & trimitere"];

// Cheia sub care pastram draftul in sessionStorage. Motivul pentru care exista:
// pagina asta e un formular cu mai multi pasi, dar starea (form) traieste doar
// in memorie React. Daca userul da refresh din greseala (sau browserul
// reincarca fila) in timp ce e la un pas mai avansat, pasul din URL (?pas=3)
// ramane neschimbat, dar datele completate la pasii anteriori (CUI, denumire
// gasita la ANAF etc.) se pierd — userul vede in continuare pasul 3-4, pare ca
// a completat tot ce vede, dar trimiterea esueaza cu "date incomplete" pentru
// campuri INVIZIBILE pe pasul curent. Persistand in sessionStorage evitam asta.
const CHEIE_DRAFT = "breasla_inregistrare_firma_draft_v1";

function citesteDraft(): Partial<WizardFormState> | null {
  if (typeof window === "undefined") return null;
  try {
    const brut = window.sessionStorage.getItem(CHEIE_DRAFT);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
}

function salveazaDraft(form: WizardFormState) {
  try {
    window.sessionStorage.setItem(CHEIE_DRAFT, JSON.stringify(form));
  } catch {
    // spatiu de stocare indisponibil (mod privat etc.) — nu e critic, doar pierdem persistenta
  }
}

function stergeDraft() {
  try {
    window.sessionStorage.removeItem(CHEIE_DRAFT);
  } catch {
    // ignoram
  }
}

export default function InregistrareFirmaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificareSesiune, setVerificareSesiune] = useState(true);
  // pasul e in URL (?pas=0..3) — asa functioneaza corect butonul Back al
  // browserului intre pasii formularului, nu doar butonul Inapoi din pagina.
  const pasRaw = Number(searchParams.get("pas") ?? "0");
  const pas = Number.isFinite(pasRaw) && pasRaw >= 0 && pasRaw <= 3 ? pasRaw : 0;

  function mergiLaPas(urmatorul: number) {
    router.push(`/inregistrare/firma?pas=${urmatorul}`);
  }
  const [form, setForm] = useState<WizardFormState>(() => ({
    ...initialWizardState,
    ...citesteDraft(),
  }));
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroareTrimitere, setEroareTrimitere] = useState<string | null>(null);
  const [rezultat, setRezultat] = useState<{ status: "approved" | "pending" } | null>(null);

  // Salvam draftul la fiecare schimbare, ca sa supravietuiasca unui refresh.
  useEffect(() => {
    salveazaDraft(form);
  }, [form]);

  // Firma se adauga DOAR de pe un cont existent — daca nu esti logat, te
  // trimitem intai sa-ti creezi contul personal (fara sa-l facem obligatoriu
  // sa aiba firma imediat).
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/inregistrare?apoi=firma");
        return;
      }
      setVerificareSesiune(false);
    });
  }, [router]);

  // scroll sus la fiecare schimbare de pas — altfel ramai jos, unde erai
  // cand ai apasat Continua pe pasul anterior
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pas]);

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
      stergeDraft();
    } catch {
      setEroareTrimitere("Nu am putut trimite datele. Verifică conexiunea și încearcă din nou.");
    } finally {
      setSeTrimite(false);
    }
  }

  if (verificareSesiune) {
    return <SkeletonPage />;
  }

  if (rezultat) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <Card>
          {rezultat.status === "approved" ? (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-teal" />
              <h1 className="mt-4 text-xl font-semibold text-ink">Firma ta e verificată!</h1>
              <p className="mt-2 text-sm text-ink-soft">
                CUI-ul a fost validat automat la ANAF, iar profilul firmei e deja vizibil în catalog.
              </p>
            </>
          ) : (
            <>
              <Clock className="mx-auto h-10 w-10 text-seal" />
              <h1 className="mt-4 text-xl font-semibold text-ink">Înregistrare primită</h1>
              <p className="mt-2 text-sm text-ink-soft">
                Profilul firmei a intrat în verificare manuală și va fi publicat de un
                administrator în curând.
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
      <div className="text-center">
        <p className="stamp-label text-seal">Firmă nouă</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Adaugă o firmă la contul tău
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Îți ia câteva minute. Preluăm automat datele oficiale de la ANAF.
        </p>
      </div>

      {/* Stepper — arata clar unde esti si cat a mai ramas */}
      <div className="mt-8">
        <div className="flex items-center gap-1.5">
          {ETAPE.map((eticheta, i) => (
            <div key={eticheta} className="flex flex-1 flex-col gap-2">
              <div
                className={
                  "h-1.5 rounded-full transition-all duration-500 " +
                  (i < pas ? "gradient-seal" : i === pas ? "gradient-seal animate-pulse" : "bg-line")
                }
              />
              <span
                className={
                  "hidden text-center text-[10px] font-semibold uppercase tracking-wide transition-colors sm:block " +
                  (i <= pas ? "text-seal" : "text-ink-soft/50")
                }
              >
                {eticheta}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs font-semibold uppercase tracking-wide text-seal sm:hidden">
          Pasul {pas + 1} din {ETAPE.length} · {ETAPE[pas]}
        </p>
      </div>

      <Card variant="raised" className="mt-6">
        {pas === 0 && (
          <StepCui form={form} update={update} onNext={() => mergiLaPas(1)} onBack={() => router.push("/dashboard")} />
        )}
        {pas === 1 && (
          <StepDetalii form={form} update={update} onNext={() => mergiLaPas(2)} onBack={() => router.back()} />
        )}
        {pas === 2 && (
          <StepDomenii form={form} update={update} onNext={() => mergiLaPas(3)} onBack={() => router.back()} />
        )}
        {pas === 3 && (
          <StepNevoi
            form={form}
            update={update}
            onBack={() => router.back()}
            onSubmit={trimite}
            seTrimite={seTrimite}
            eroareTrimitere={eroareTrimitere}
          />
        )}
      </Card>
    </div>
  );
}
