"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-line bg-paper-white p-4 sm:grid-cols-2 lg:grid-cols-5">
      <Input
        placeholder="Caută după nume firmă..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="lg:col-span-2"
      />
      <Select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
        <option value="">Toate domeniile</option>
        {categorii.map((c) => (
          <option key={c.id} value={c.slug}>{c.name_ro}</option>
        ))}
      </Select>
      <Select value={judet} onChange={(e) => setJudet(e.target.value)}>
        <option value="">Toate județele</option>
        {judete.map((j) => (
          <option key={j.cod} value={j.cod}>{j.nume}</option>
        ))}
      </Select>
      <div className="flex gap-2">
        <Input
          placeholder="Adresă / oraș (rază km)"
          value={locatie}
          onChange={(e) => setLocatie(e.target.value)}
        />
        <Input
          type="number"
          min={1}
          className="w-20"
          value={raza}
          onChange={(e) => setRaza(e.target.value)}
        />
      </div>
      <Button type="submit" className="lg:col-span-5 lg:w-fit">
        <Search className="h-4 w-4" /> Caută
      </Button>
    </form>
  );
}
