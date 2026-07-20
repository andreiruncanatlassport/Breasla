"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Search, X, Loader2, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, SectionLabel, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import type { Category, Judet } from "@/types/database";

interface FirmaScurt {
  id: string;
  denumire: string;
  localitate: string | null;
  discount_procent: number | null;
}

const MAX_DESTINATARI = 10;

export default function CerereNouaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [titlu, setTitlu] = useState("");
  const [descriere, setDescriere] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [judetCod, setJudetCod] = useState("");
  const [bugetMin, setBugetMin] = useState("");
  const [bugetMax, setBugetMax] = useState("");
  const [termen, setTermen] = useState("");

  const [categorii, setCategorii] = useState<Category[]>([]);
  const [judete, setJudete] = useState<Judet[]>([]);
  const [cautare, setCautare] = useState("");
  const [rezultate, setRezultate] = useState<FirmaScurt[]>([]);
  const [selectate, setSelectate] = useState<FirmaScurt[]>([]);
  const [seCauta, setSeCauta] = useState(false);
  const [seTrimite, setSeTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("id, slug, name_ro, name_en, parent_id, ordine, created_at")
      .is("parent_id", null)
      .order("ordine")
      .then(({ data }) => setCategorii((data as Category[]) ?? []));
    supabase
      .from("judete")
      .select("cod, nume")
      .order("nume")
      .then(({ data }) => setJudete((data as Judet[]) ?? []));
  }, []);

  // Daca ajungi aici de pe profilul unei firme, o preselectam.
  useEffect(() => {
    const preselectat = searchParams.get("catre");
    if (!preselectat) return;
    const supabase = createClient();
    supabase
      .from("companies")
      .select("id, denumire, localitate, discount_procent")
      .eq("id", preselectat)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSelectate([data as FirmaScurt]);
      });
  }, [searchParams]);

  async function cauta() {
    if (!cautare.trim()) return;
    setSeCauta(true);
    const supabase = createClient();
    let q = supabase
      .from("companies")
      .select("id, denumire, localitate, discount_procent")
      .eq("status", "approved")
      .ilike("denumire", `%${cautare.trim()}%`)
      .limit(8);
    if (judetCod) q = q.eq("judet_cod", judetCod);
    const { data } = await q;
    setRezultate((data as FirmaScurt[]) ?? []);
    setSeCauta(false);
  }

  function comutaFirma(f: FirmaScurt) {
    setSelectate((prev) =>
      prev.some((x) => x.id === f.id)
        ? prev.filter((x) => x.id !== f.id)
        : prev.length >= MAX_DESTINATARI
          ? prev
          : [...prev, f]
    );
  }

  async function trimite() {
    setEroare(null);
    if (!titlu.trim() || !descriere.trim()) {
      setEroare("Completează titlul și descrierea.");
      return;
    }
    if (selectate.length === 0) {
      setEroare("Alege cel puțin o firmă căreia să trimiți cererea.");
      return;
    }

    setSeTrimite(true);
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titlu,
          descriere,
          category_id: categoryId || null,
          judet_cod: judetCod || null,
          buget_min: bugetMin ? Number(bugetMin) : null,
          buget_max: bugetMax ? Number(bugetMax) : null,
          termen_limita: termen || null,
          destinatari: selectate.map((f) => f.id),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json.error);
        return;
      }
      router.push(`/dashboard/cereri/${json.data.id}`);
    } finally {
      setSeTrimite(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="stamp-label text-seal">Cerere de ofertă</p>
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">
        Descrie ce ai nevoie
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Trimite o cerere structurată către mai multe firme deodată și primești răspunsurile
        într-un singur loc.
      </p>

      <Card variant="raised" className="mt-6 space-y-5">
        <div>
          <Label required>Titlu</Label>
          <Input
            value={titlu}
            onChange={(e) => setTitlu(e.target.value)}
            placeholder="ex: Instalație electrică hală 400mp"
          />
        </div>

        <div>
          <Label required>Descriere</Label>
          <Textarea
            value={descriere}
            onChange={(e) => setDescriere(e.target.value)}
            placeholder="Descrie lucrarea, contextul, ce aștepți de la colaborator..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Domeniu</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Nespecificat</option>
              {categorii.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ro}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Județ</Label>
            <Select value={judetCod} onChange={(e) => setJudetCod(e.target.value)}>
              <option value="">Nespecificat</option>
              {judete.map((j) => (
                <option key={j.cod} value={j.cod}>{j.nume}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Buget de la (lei)</Label>
            <Input type="number" min={0} value={bugetMin} onChange={(e) => setBugetMin(e.target.value)} />
          </div>
          <div>
            <Label>până la (lei)</Label>
            <Input type="number" min={0} value={bugetMax} onChange={(e) => setBugetMax(e.target.value)} />
          </div>
          <div>
            <Label>Termen</Label>
            <Input type="date" value={termen} onChange={(e) => setTermen(e.target.value)} />
          </div>
        </div>
        <FieldHint>Bugetul e opțional, dar crește șansele să primești răspunsuri realiste.</FieldHint>
      </Card>

      <div className="mt-6">
        <SectionLabel icon={<Send className="h-3.5 w-3.5" />}>
          Către cine trimiți ({selectate.length}/{MAX_DESTINATARI})
        </SectionLabel>

        <Card className="mt-3">
          {selectate.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectate.map((f) => (
                <span
                  key={f.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-seal/12 px-3 py-1.5 text-xs font-semibold text-seal ring-1 ring-inset ring-seal/25"
                >
                  {f.denumire}
                  <button type="button" onClick={() => comutaFirma(f)} className="hover:text-rust">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/50" />
              <Input
                value={cautare}
                onChange={(e) => setCautare(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), cauta())}
                placeholder="Caută firme după nume..."
                className="pl-9"
              />
            </div>
            <Button type="button" variant="secondary" onClick={cauta} disabled={seCauta}>
              {seCauta ? <Loader2 className="h-4 w-4 animate-spin" /> : "Caută"}
            </Button>
          </div>

          {rezultate.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {rezultate.map((f) => {
                const ales = selectate.some((x) => x.id === f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => comutaFirma(f)}
                    className={
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition " +
                      (ales ? "border-seal bg-seal/8" : "border-line hover:border-line-strong")
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-ink-soft/50" />
                      <span>
                        <span className="block text-sm font-medium text-ink">{f.denumire}</span>
                        {f.localitate && (
                          <span className="block text-xs text-ink-soft">{f.localitate}</span>
                        )}
                      </span>
                    </span>
                    {f.discount_procent && <Badge tone="seal">-{f.discount_procent}%</Badge>}
                  </button>
                );
              })}
            </div>
          )}

          <FieldHint>
            Maximum {MAX_DESTINATARI} firme per cerere — ca platforma să rămână utilă, nu un canal
            de mesaje nesolicitate.
          </FieldHint>
        </Card>
      </div>

      <FieldError>{eroare}</FieldError>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>Anulează</Button>
        <Button variant="seal" onClick={trimite} disabled={seTrimite}>
          {seTrimite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Trimite cererea
        </Button>
      </div>
    </div>
  );
}
