"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, SlidersHorizontal, X, Tag, Sparkles, ArrowUpDown } from "lucide-react";
import { Input, Select, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  DIMENSIUNE_ECHIPA_OPTIUNI,
  PROIECT_MARIME_OPTIUNI,
  SORTARE_OPTIUNI,
} from "@/lib/company-attrs";
import type { Category, Judet } from "@/types/database";

interface Props {
  categorii: Category[];
  judete: Judet[];
}

/** Comutator tip "pastila" — mai rapid de folosit decât un checkbox clasic. */
function PillToggle({
  activ,
  onClick,
  children,
}: {
  activ: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all " +
        (activ
          ? "border-seal bg-seal/12 text-seal"
          : "border-line text-ink-soft hover:border-line-strong hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

export function CatalogFilters({ categorii, judete }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") ?? "");
  const [judet, setJudet] = useState(searchParams.get("judet") ?? "");
  const [locatie, setLocatie] = useState(searchParams.get("locatie") ?? "");
  const [raza, setRaza] = useState(searchParams.get("raza") ?? "30");
  const [echipa, setEchipa] = useState(searchParams.get("echipa") ?? "");
  const [proiect, setProiect] = useState(searchParams.get("proiect") ?? "");
  const [reduceri, setReduceri] = useState(searchParams.get("reduceri") === "1");
  const [noi, setNoi] = useState(searchParams.get("noi") === "1");
  const [sortare, setSortare] = useState(searchParams.get("sortare") ?? "relevanta");
  const [avansat, setAvansat] = useState(
    Boolean(searchParams.get("locatie") || searchParams.get("echipa") || searchParams.get("proiect"))
  );

  const areFiltre = Boolean(
    q || categorie || judet || locatie || echipa || proiect || reduceri || noi
  );

  function construiesteUrl(patch?: Record<string, string | null>) {
    const params = new URLSearchParams();
    const valori: Record<string, string | null> = {
      q: q || null,
      categorie: categorie || null,
      judet: judet || null,
      echipa: echipa || null,
      proiect: proiect || null,
      reduceri: reduceri ? "1" : null,
      noi: noi ? "1" : null,
      sortare: sortare !== "relevanta" ? sortare : null,
      locatie: locatie || null,
      raza: locatie ? raza || "30" : null,
      ...patch,
    };
    for (const [k, v] of Object.entries(valori)) if (v) params.set(k, v);
    return `/catalog?${params.toString()}`;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(construiesteUrl());
  }

  function comutaSiCauta(patch: Record<string, string | null>) {
    router.push(construiesteUrl(patch));
  }

  function reseteaza() {
    setQ(""); setCategorie(""); setJudet(""); setLocatie("");
    setEchipa(""); setProiect(""); setReduceri(false); setNoi(false); setSortare("relevanta");
    router.push("/catalog");
  }

  return (
    <form onSubmit={handleSubmit} className="block-raised overflow-hidden p-0">
      {/* rand principal de cautare */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/50" />
          <Input
            placeholder="Caută după numele firmei..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setAvansat((v) => !v)} className="shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
            Filtre
          </Button>
          <Button type="submit" variant="seal" className="shrink-0">
            Caută
          </Button>
        </div>
      </div>

      {/* filtre rapide — un click, cauta imediat */}
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-ink/3 px-4 py-3">
        <PillToggle
          activ={reduceri}
          onClick={() => { setReduceri(!reduceri); comutaSiCauta({ reduceri: !reduceri ? "1" : null }); }}
        >
          <Tag className="h-3 w-3" /> Oferă reduceri
        </PillToggle>
        <PillToggle
          activ={noi}
          onClick={() => { setNoi(!noi); comutaSiCauta({ noi: !noi ? "1" : null }); }}
        >
          <Sparkles className="h-3 w-3" /> Firme noi
        </PillToggle>

        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-ink-soft/60" />
          <select
            value={sortare}
            onChange={(e) => { setSortare(e.target.value); comutaSiCauta({ sortare: e.target.value !== "relevanta" ? e.target.value : null }); }}
            className="cursor-pointer rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink outline-none focus:border-seal"
          >
            {SORTARE_OPTIUNI.map((o) => (
              <option key={o.id} value={o.id}>{o.eticheta}</option>
            ))}
          </select>
        </div>
      </div>

      {/* filtre detaliate */}
      {avansat && (
        <div className="border-t border-line bg-ink/3 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Domeniu de activitate</Label>
              <Select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
                <option value="">Toate domeniile</option>
                {categorii.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name_ro}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Județ</Label>
              <Select value={judet} onChange={(e) => setJudet(e.target.value)}>
                <option value="">Toate județele</option>
                {judete.map((j) => (
                  <option key={j.cod} value={j.cod}>{j.nume}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Dimensiune echipă</Label>
              <Select value={echipa} onChange={(e) => setEchipa(e.target.value)}>
                <option value="">Orice dimensiune</option>
                {DIMENSIUNE_ECHIPA_OPTIUNI.map((o) => (
                  <option key={o.id} value={o.id}>{o.lung}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Mărime proiect potrivită</Label>
              <Select value={proiect} onChange={(e) => setProiect(e.target.value)}>
                <option value="">Orice mărime</option>
                {PROIECT_MARIME_OPTIUNI.map((o) => (
                  <option key={o.id} value={o.id}>{o.lung}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-[1fr_auto]">
            <div>
              <Label>Firme care deservesc zona</Label>
              <Input
                placeholder="ex: Târgu Mureș"
                value={locatie}
                onChange={(e) => setLocatie(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-28">
              <Label>Rază (km)</Label>
              <Input
                type="number"
                min={1}
                value={raza}
                onChange={(e) => setRaza(e.target.value)}
                className="font-mono-num"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {areFiltre ? (
              <button
                type="button"
                onClick={reseteaza}
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft transition-colors hover:text-rust"
              >
                <X className="h-3 w-3" /> Resetează filtrele
              </button>
            ) : <span />}
            <Button type="submit" variant="seal" size="sm">Aplică filtrele</Button>
          </div>
        </div>
      )}
    </form>
  );
}
