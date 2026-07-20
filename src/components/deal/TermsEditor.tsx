"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, BookOpen, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import type { ClauseTemplate, DealClauza, DealEtapa, DealVersion } from "@/types/database";

interface Props {
  dealId: string;
  categoryId: string | null;
  versiuneCurenta: DealVersion | null;
  onAnuleaza: () => void;
}

export function TermsEditor({ dealId, categoryId, versiuneCurenta, onAnuleaza }: Props) {
  const router = useRouter();

  // Pornim de la versiunea curenta (contra-oferta) sau de la zero
  const [descriere, setDescriere] = useState(versiuneCurenta?.descriere_lucrare ?? "");
  const [pret, setPret] = useState(versiuneCurenta?.pret_total?.toString() ?? "");
  const [moneda, setMoneda] = useState<"RON" | "EUR">(versiuneCurenta?.moneda ?? "RON");
  const [modalitatePlata, setModalitatePlata] = useState(versiuneCurenta?.modalitate_plata ?? "");
  const [termenStart, setTermenStart] = useState(versiuneCurenta?.termen_start ?? "");
  const [termenFinal, setTermenFinal] = useState(versiuneCurenta?.termen_final ?? "");
  const [clauze, setClauze] = useState<DealClauza[]>(versiuneCurenta?.clauze ?? []);
  const [etape, setEtape] = useState<DealEtapa[]>(versiuneCurenta?.etape ?? []);
  const [nota, setNota] = useState("");

  const [sabloane, setSabloane] = useState<ClauseTemplate[]>([]);
  const [bibliotecaDeschisa, setBibliotecaDeschisa] = useState(false);
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // Clauzele generice (fara categorie) + cele specifice domeniului firmei
    const filtru = categoryId ? `category_id.is.null,category_id.eq.${categoryId}` : "category_id.is.null";
    supabase
      .from("clause_templates")
      .select("id, category_id, titlu, continut, ordine, created_at")
      .or(filtru)
      .order("ordine")
      .then(({ data }) => setSabloane((data as ClauseTemplate[]) ?? []));
  }, [categoryId]);

  function adaugaClauza(c?: ClauseTemplate) {
    setClauze((prev) => [...prev, c ? { titlu: c.titlu, continut: c.continut } : { titlu: "", continut: "" }]);
  }
  function actualizeazaClauza(i: number, patch: Partial<DealClauza>) {
    setClauze((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function stergeClauza(i: number) {
    setClauze((prev) => prev.filter((_, idx) => idx !== i));
  }

  function adaugaEtapa() {
    setEtape((prev) => [...prev, { titlu: "", descriere: "", termen: null, suma: null }]);
  }
  function actualizeazaEtapa(i: number, patch: Partial<DealEtapa>) {
    setEtape((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function stergeEtapa(i: number) {
    setEtape((prev) => prev.filter((_, idx) => idx !== i));
  }

  const sumaEtape = etape.reduce((s, e) => s + (Number(e.suma) || 0), 0);
  const pretNumar = Number(pret) || 0;
  const nepotrivire = etape.length > 0 && pretNumar > 0 && Math.abs(sumaEtape - pretNumar) > 0.01;

  async function trimite() {
    setEroare(null);
    if (!descriere.trim()) {
      setEroare("Descrie pe scurt lucrarea.");
      return;
    }
    setSeTrimite(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/versiuni`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descriere_lucrare: descriere,
          pret_total: pret ? Number(pret) : null,
          moneda,
          modalitate_plata: modalitatePlata || null,
          termen_start: termenStart || null,
          termen_final: termenFinal || null,
          clauze: clauze.filter((c) => c.titlu.trim()),
          etape: etape.filter((e) => e.titlu?.trim()),
          nota_modificare: nota || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      router.refresh();
      onAnuleaza();
    } finally {
      setSeTrimite(false);
    }
  }

  const clauzeNefolosite = sabloane.filter((s) => !clauze.some((c) => c.titlu === s.titlu));

  return (
    <Card variant="raised" className="space-y-6">
      <div>
        <p className="stamp-label text-seal">
          {versiuneCurenta ? `Contra-ofertă (pornind de la v${versiuneCurenta.numar})` : "Prima propunere"}
        </p>
        <h3 className="mt-1.5 text-lg font-semibold text-ink">Propune termenii</h3>
      </div>

      <div>
        <Label required>Descrierea lucrării</Label>
        <Textarea
          value={descriere}
          onChange={(e) => setDescriere(e.target.value)}
          placeholder="Ce anume se execută, ce include, ce nu include..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <div>
          <Label>Preț total</Label>
          <Input type="number" min={0} value={pret} onChange={(e) => setPret(e.target.value)} className="font-mono-num" />
        </div>
        <div>
          <Label>Monedă</Label>
          <Select value={moneda} onChange={(e) => setMoneda(e.target.value as "RON" | "EUR")}>
            <option value="RON">RON</option>
            <option value="EUR">EUR</option>
          </Select>
        </div>
      </div>

      <div>
        <Label>Modalitate de plată</Label>
        <Input
          value={modalitatePlata}
          onChange={(e) => setModalitatePlata(e.target.value)}
          placeholder="ex: 30% avans, 70% la recepție, plată la 15 zile de la factură"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Început</Label>
          <Input type="date" value={termenStart ?? ""} onChange={(e) => setTermenStart(e.target.value)} />
        </div>
        <div>
          <Label>Finalizare</Label>
          <Input type="date" value={termenFinal ?? ""} onChange={(e) => setTermenFinal(e.target.value)} />
        </div>
      </div>

      {/* ETAPE */}
      <div className="border-t border-line pt-5">
        <div className="flex items-center justify-between">
          <div>
            <Label>Etape</Label>
            <FieldHint>Împarte lucrarea în faze, cu termene și sume proprii.</FieldHint>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={adaugaEtapa}>
            <Plus className="h-3.5 w-3.5" /> Etapă
          </Button>
        </div>

        <div className="mt-3 space-y-3">
          {etape.map((e, i) => (
            <div key={i} className="block-inset p-4">
              <div className="flex gap-2">
                <Input
                  value={e.titlu ?? ""}
                  onChange={(ev) => actualizeazaEtapa(i, { titlu: ev.target.value })}
                  placeholder="ex: Avans la semnare"
                />
                <button onClick={() => stergeEtapa(i)} className="shrink-0 px-2 text-ink-soft/50 hover:text-rust">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Input
                  type="date"
                  value={e.termen ?? ""}
                  onChange={(ev) => actualizeazaEtapa(i, { termen: ev.target.value || null })}
                />
                <Input
                  type="number"
                  min={0}
                  value={e.suma ?? ""}
                  onChange={(ev) => actualizeazaEtapa(i, { suma: ev.target.value ? Number(ev.target.value) : null })}
                  placeholder={`Sumă (${moneda})`}
                  className="font-mono-num"
                />
              </div>
              <Input
                className="mt-2"
                value={e.descriere ?? ""}
                onChange={(ev) => actualizeazaEtapa(i, { descriere: ev.target.value })}
                placeholder="Detalii (opțional)"
              />
            </div>
          ))}
        </div>

        {etape.length > 0 && (
          <p className={`mt-2 text-xs ${nepotrivire ? "font-medium text-rust" : "text-ink-soft"}`}>
            Total etape:{" "}
            <span className="font-mono-num">{sumaEtape.toLocaleString("ro-RO")} {moneda}</span>
            {nepotrivire && ` — nu se potrivește cu prețul total (${pretNumar.toLocaleString("ro-RO")} ${moneda})`}
          </p>
        )}
      </div>

      {/* CLAUZE */}
      <div className="border-t border-line pt-5">
        <div className="flex items-center justify-between">
          <div>
            <Label>Clauze</Label>
            <FieldHint>Alege din bibliotecă sau scrie clauze proprii.</FieldHint>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setBibliotecaDeschisa((v) => !v)}
            >
              <BookOpen className="h-3.5 w-3.5" /> Bibliotecă
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => adaugaClauza()}>
              <Plus className="h-3.5 w-3.5" /> Proprie
            </Button>
          </div>
        </div>

        {bibliotecaDeschisa && (
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-line bg-ink/3 p-3">
            {clauzeNefolosite.length === 0 && (
              <p className="py-2 text-center text-xs text-ink-soft">Ai adăugat deja toate clauzele disponibile.</p>
            )}
            {clauzeNefolosite.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => adaugaClauza(s)}
                className="block w-full rounded-lg border border-line bg-surface p-3 text-left transition hover:border-seal"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{s.titlu}</span>
                  {!s.category_id && <span className="stamp-label shrink-0 text-ink-soft/60">general</span>}
                </span>
                <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-ink-soft">{s.continut}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 space-y-3">
          {clauze.map((c, i) => (
            <div key={i} className="block-inset p-4">
              <div className="flex gap-2">
                <Input
                  value={c.titlu}
                  onChange={(e) => actualizeazaClauza(i, { titlu: e.target.value })}
                  placeholder="Titlul clauzei"
                />
                <button onClick={() => stergeClauza(i)} className="shrink-0 px-2 text-ink-soft/50 hover:text-rust">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                className="mt-2 min-h-[70px]"
                value={c.continut}
                onChange={(e) => actualizeazaClauza(i, { continut: e.target.value })}
                placeholder="Conținutul clauzei"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <Label>Ce ai schimbat / de ce (opțional)</Label>
        <Input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="ex: am ajustat prețul și am decalat termenul cu 5 zile"
        />
        <FieldHint>Apare în istoricul negocierii, ca cealaltă firmă să înțeleagă rapid.</FieldHint>
      </div>

      <FieldError>{eroare}</FieldError>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onAnuleaza} disabled={seTrimite}>
          <X className="h-4 w-4" /> Renunță
        </Button>
        <Button variant="seal" onClick={trimite} disabled={seTrimite}>
          {seTrimite ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Trimite propunerea
        </Button>
      </div>
    </Card>
  );
}
