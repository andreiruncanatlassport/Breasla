"use client";

import { useState } from "react";
import { Search, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import type { WizardFormState } from "../types";

interface Props {
  form: WizardFormState;
  update: (patch: Partial<WizardFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCui({ form, update, onNext, onBack }: Props) {
  const [cuiInput, setCuiInput] = useState(form.cui ? String(form.cui) : "");
  const [seIncarca, setSeIncarca] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [gasit, setGasit] = useState(Boolean(form.denumire));

  async function cautaCui() {
    setEroare(null);
    const cuiCurat = cuiInput.replace(/^RO/i, "").replace(/\D/g, "");
    const cui = Number(cuiCurat);

    if (!cui) {
      setEroare("Introdu un CUI valid (doar cifre).");
      return;
    }

    setSeIncarca(true);
    try {
      const res = await fetch("/api/anaf/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cui }),
      });
      const json = await res.json();

      if (!res.ok) {
        setEroare(json.error || "Nu am găsit firma.");
        setGasit(false);
        return;
      }

      const d = json.data;
      update({
        cui,
        denumire: d.denumire || "",
        nr_reg_com: d.nrRegCom || "",
        adresa_sediu: d.adresa || "",
        stare_inregistrare: d.stareInregistrare || "",
        data_inregistrare: d.dataInregistrare || "",
        cod_caen_principal: d.codCaenPrincipal || "",
        tva_activ: d.tvaActiv,
        radiata: d.radiata,
        anaf_raspuns_brut: d.raspunsBrut,
        localitate: d.localitateNume || "",
        judet_nume_anaf: d.judetNume || "",
        cod_postal: d.codPostalSediu || "",
      });
      setGasit(true);

      // geocodam adresa in fundal, fara sa blocam UI-ul
      if (d.adresa) {
        fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adresa: d.adresa }),
        })
          .then((r) => r.json())
          .then((geo) => {
            if (geo?.data) update({ lat: geo.data.lat, lng: geo.data.lng });
          })
          .catch(() => {});
      }

      // incercam sa preluam si cifra de afaceri din bilant (Faza 1: automat)
      fetch("/api/anaf/bilant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cui }),
      })
        .then((r) => r.json())
        .then((b) => {
          if (b?.data?.gasit) {
            update({
              cifra_afaceri_an: b.data.an,
              cifra_afaceri_valoare: b.data.cifraAfaceri,
              profit_net: b.data.profitNet,
              cifra_afaceri_sursa: "anaf_auto",
              numar_angajati: b.data.numarSalariati ?? undefined,
            });
          } else {
            update({ cifra_afaceri_sursa: "indisponibila" });
          }
        })
        .catch(() => update({ cifra_afaceri_sursa: "indisponibila" }));
    } catch {
      setEroare("Nu am putut contacta serviciul ANAF. Încearcă din nou.");
    } finally {
      setSeIncarca(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="cui" required>CUI (Cod Unic de Înregistrare)</Label>
        <div className="flex gap-2">
          <Input
            id="cui"
            value={cuiInput}
            onChange={(e) => {
              setCuiInput(e.target.value);
              setGasit(false);
            }}
            placeholder="ex: 12345678"
            className="font-mono-num"
          />
          <Button type="button" variant="secondary" onClick={cautaCui} disabled={seIncarca}>
            {seIncarca ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Caută la ANAF
          </Button>
        </div>
        <FieldError>{eroare}</FieldError>
      </div>

      {gasit && form.denumire && (
        <Card className="border-teal/30 bg-teal/5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
            <div className="text-sm">
              <p className="font-semibold text-ink">{form.denumire}</p>
              <p className="mt-1 text-ink-soft">{form.adresa_sediu}</p>
              <p className="mt-1 text-ink-soft">Nr. Reg. Com.: {form.nr_reg_com || "—"}</p>
              <p className="mt-1 text-ink-soft">Stare: {form.stare_inregistrare || "—"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={form.tva_activ ? "success" : "neutral"}>
                  {form.tva_activ ? "Plătitor de TVA" : "Neplătitor de TVA"}
                </Badge>
                {form.radiata && <Badge tone="danger">Firmă radiată</Badge>}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Înapoi
        </Button>
        <Button type="button" onClick={onNext} disabled={!gasit || !form.denumire}>
          Continuă
        </Button>
      </div>
    </div>
  );
}
