"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input, Select, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Category, Judet } from "@/types/database";

interface Props {
  categorii: Category[];
  judete: Judet[];
}

export function CatalogFilters({ categorii, judete }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") ?? "");
  const [judet, setJudet] = useState(searchParams.get("judet") ?? "");
  const [locatie, setLocatie] = useState(searchParams.get("locatie") ?? "");
  const [raza, setRaza] = useState(searchParams.get("raza") ?? "30");
  const [avansat, setAvansat] = useState(Boolean(searchParams.get("locatie")));

  const areFiltre = Boolean(q || categorie || judet || locatie);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categorie) params.set("categorie", categorie);
    if (judet) params.set("judet", judet);
    if (locatie) {
      params.set("locatie", locatie);
      params.set("raza", raza || "30");
    }
    router.push(`/catalog?${params.toString()}`);
  }

  function reseteaza() {
    setQ("");
    setCategorie("");
    setJudet("");
    setLocatie("");
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
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAvansat((v) => !v)}
            className="shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtre
          </Button>
          <Button type="submit" variant="seal" className="shrink-0">
            Caută
          </Button>
        </div>
      </div>

      {/* filtre — zona vizual "scobita", clar distincta de randul de sus */}
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
        </div>

        {avansat && (
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
        )}

        {areFiltre && (
          <button
            type="button"
            onClick={reseteaza}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ink-soft transition-colors hover:text-rust"
          >
            <X className="h-3 w-3" /> Resetează filtrele
          </button>
        )}
      </div>
    </form>
  );
}
