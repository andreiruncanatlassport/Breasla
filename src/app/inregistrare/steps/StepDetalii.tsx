"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeazaText } from "@/lib/text";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldHint } from "@/components/ui/Field";
import type { Judet } from "@/types/database";
import type { WizardFormState } from "../types";

interface Props {
  form: WizardFormState;
  update: (patch: Partial<WizardFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDetalii({ form, update, onNext, onBack }: Props) {
  const [judete, setJudete] = useState<Judet[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("judete")
      .select("cod, nume")
      .order("nume")
      .then(({ data }) => setJudete((data as Judet[]) ?? []));
  }, []);

  // auto-selecteaza judetul o singura data, pe baza numelui primit de la ANAF
  useEffect(() => {
    if (form.judet_cod || !form.judet_nume_anaf || judete.length === 0) return;
    const tinta = normalizeazaText(form.judet_nume_anaf);
    const gasit = judete.find((j) => normalizeazaText(j.nume) === tinta || tinta.includes(normalizeazaText(j.nume)));
    if (gasit) update({ judet_cod: gasit.cod });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [judete, form.judet_nume_anaf]);

  const gataDeContinuare = Boolean(form.judet_cod && form.telefon_firma);

  function toggleJudetSuplimentar(cod: string) {
    const are = form.judete_suplimentare.includes(cod);
    update({
      judete_suplimentare: are
        ? form.judete_suplimentare.filter((c) => c !== cod)
        : [...form.judete_suplimentare, cod],
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="judet" required>Județul sediului</Label>
          <Select
            id="judet"
            required
            value={form.judet_cod}
            onChange={(e) => update({ judet_cod: e.target.value })}
          >
            <option value="">Alege...</option>
            {judete.map((j) => (
              <option key={j.cod} value={j.cod}>{j.nume}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="localitate">Localitate</Label>
          <Input
            id="localitate"
            value={form.localitate}
            onChange={(e) => update({ localitate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="telefonFirma" required>Telefon firmă (public)</Label>
          <Input
            id="telefonFirma"
            type="tel"
            required
            value={form.telefon_firma}
            onChange={(e) => update({ telefon_firma: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="emailFirma">Email firmă (public)</Label>
          <Input
            id="emailFirma"
            type="email"
            value={form.email_firma}
            onChange={(e) => update({ email_firma: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://..."
          value={form.website}
          onChange={(e) => update({ website: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="descriere">Descriere firmă</Label>
        <Textarea
          id="descriere"
          placeholder="Cu ce se ocupă firma ta, pe scurt..."
          value={form.descriere}
          onChange={(e) => update({ descriere: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="dimensiune">Dimensiune echipă</Label>
          <Select
            id="dimensiune"
            value={form.dimensiune_echipa}
            onChange={(e) =>
              update({ dimensiune_echipa: e.target.value as WizardFormState["dimensiune_echipa"] })
            }
          >
            <option value="">Alege...</option>
            <option value="1">1 (doar eu)</option>
            <option value="2-9">2-9</option>
            <option value="10-49">10-49</option>
            <option value="50-249">50-249</option>
            <option value="250+">250+</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="angajati">Nr. angajați (opțional, exact)</Label>
          <Input
            id="angajati"
            type="number"
            min={0}
            value={form.numar_angajati ?? ""}
            onChange={(e) => update({ numar_angajati: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="raza">Zonă deservită — rază în jurul sediului (km)</Label>
        <Input
          id="raza"
          type="number"
          min={0}
          placeholder="ex: 50 (lasă gol dacă deservești tot județul)"
          value={form.raza_deservire_km ?? ""}
          onChange={(e) =>
            update({ raza_deservire_km: e.target.value ? Number(e.target.value) : null })
          }
        />
        <FieldHint>
          Firma ta va apărea în căutările din raza aleasă, calculată din adresa sediului.
        </FieldHint>
      </div>

      <div>
        <Label>Deservești și alte județe explicit? (opțional)</Label>
        <div className="mt-2 grid max-h-40 grid-cols-2 gap-x-4 gap-y-1.5 overflow-y-auto rounded-lg border border-line bg-paper-white p-3 sm:grid-cols-3">
          {judete.map((j) => (
            <label key={j.cod} className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={form.judete_suplimentare.includes(j.cod)}
                onChange={() => toggleJudetSuplimentar(j.cod)}
                className="rounded border-line accent-seal"
              />
              {j.nume}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>Înapoi</Button>
        <Button type="button" onClick={onNext} disabled={!gataDeContinuare}>Continuă</Button>
      </div>
    </div>
  );
}
