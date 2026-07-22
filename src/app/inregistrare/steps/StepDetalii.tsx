"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeazaText } from "@/lib/text";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldHint } from "@/components/ui/Field";
import { REGIUNI } from "@/lib/regiuni";
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

  // Telefon: doar cifre, mereu incepe cu 0, maxim 10 cifre — un numar de
  // telefon romanesc valid arata mereu asa (ex: 07XX XXX XXX sau 02XX/03XX...).
  function formateazaTelefon(valoareBruta: string): string {
    let cifre = valoareBruta.replace(/\D/g, "");
    if (cifre.length > 0 && cifre[0] !== "0") cifre = "0" + cifre;
    return cifre.slice(0, 10);
  }

  const telefonValid = form.telefon_firma.length === 10;

  const gataDeContinuare = Boolean(
    form.judet_cod &&
      form.localitate.trim() &&
      telefonValid &&
      form.dimensiune_echipa &&
      form.zona_deservita.trim()
  );

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
          <Label htmlFor="localitate" required>Localitate</Label>
          <Input
            id="localitate"
            required
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
            inputMode="numeric"
            placeholder="ex: 0712345678"
            value={form.telefon_firma}
            onChange={(e) => update({ telefon_firma: formateazaTelefon(e.target.value) })}
          />
          {form.telefon_firma && !telefonValid && (
            <p className="mt-1 text-xs text-ember">Numărul trebuie să aibă exact 10 cifre.</p>
          )}
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
          <Label htmlFor="dimensiune" required>Dimensiune echipă</Label>
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
        <Label htmlFor="zonaDeservita" required>Zonă deservită</Label>
        <Input
          id="zonaDeservita"
          required
          placeholder="ex: Cluj-Napoca și împrejurimi, sau «online, la nivel național»"
          value={form.zona_deservita}
          onChange={(e) => update({ zona_deservita: e.target.value })}
          maxLength={200}
        />
        <FieldHint>
          Scrie liber, cu cuvintele tale, unde lucrezi. Poți detalia mai jos și cu rază exactă
          sau județe punctuale — sunt opționale.
        </FieldHint>
      </div>

      <div>
        <Label htmlFor="raza">Rază în jurul sediului, în km (opțional)</Label>
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
        <div className="flex items-center justify-between">
          <Label>Deservești și alte județe explicit? (opțional)</Label>
          <button
            type="button"
            onClick={() =>
              update({
                judete_suplimentare:
                  form.judete_suplimentare.length === judete.length ? [] : judete.map((j) => j.cod),
              })
            }
            className="shrink-0 text-xs font-semibold text-seal hover:underline"
          >
            {form.judete_suplimentare.length === judete.length ? "Deselectează tot" : "Selectează tot"}
          </button>
        </div>

        {/* Selectare rapida pe regiuni istorice — adauga toate judetele din regiune deodata */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REGIUNI.map((r) => {
            const toateBifate = r.judete.every((c) => form.judete_suplimentare.includes(c));
            return (
              <button
                key={r.nume}
                type="button"
                onClick={() => {
                  const set = new Set(form.judete_suplimentare);
                  if (toateBifate) {
                    r.judete.forEach((c) => set.delete(c));
                  } else {
                    r.judete.forEach((c) => set.add(c));
                  }
                  update({ judete_suplimentare: [...set] });
                }}
                className={
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition " +
                  (toateBifate
                    ? "border-seal bg-seal/10 text-seal"
                    : "border-line text-ink-soft hover:border-seal/40 hover:text-ink")
                }
              >
                {r.nume}
              </button>
            );
          })}
        </div>

        <div className="mt-2 grid max-h-40 grid-cols-2 gap-x-4 gap-y-1.5 overflow-y-auto rounded-lg border border-line bg-surface p-3 sm:grid-cols-3">
          {judete.map((j) => (
            <label key={j.cod} className="flex items-center gap-2 text-sm text-ink">
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
