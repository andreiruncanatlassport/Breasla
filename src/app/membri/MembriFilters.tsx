"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input, Select, Label } from "@/components/ui/Field";
import type { Judet } from "@/types/database";

interface Props {
  judete: Judet[];
  tagOptions: { id: string; label: string }[];
}

export function MembriFilters({ judete, tagOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deschis, setDeschis] = useState(false);

  const q = searchParams.get("q") ?? "";
  const judet = searchParams.get("judet") ?? "";
  const firma = searchParams.get("firma") ?? "";
  const nevoiActive = (searchParams.get("nevoie") ?? "").split(",").filter(Boolean);

  const filtreActive = [judet, firma, ...nevoiActive].filter(Boolean).length;

  function seteaza(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/membri?${params.toString()}`);
  }

  function toggleNevoie(id: string) {
    const set = new Set(nevoiActive);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    seteaza({ nevoie: [...set].join(",") || null });
  }

  function onSubmitCautare(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    seteaza({ q: (fd.get("q") as string) || null });
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2.5">
        <form onSubmit={onSubmitCautare} className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/50" />
          <Input name="q" defaultValue={q} placeholder="Caută după nume, firmă, domeniu..." className="pl-9" />
        </form>

        <button
          type="button"
          onClick={() => setDeschis((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line-strong px-3.5 py-2.5 text-sm font-semibold text-ink transition hover:border-seal/40"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtre
          {filtreActive > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-seal text-[11px] font-bold text-white">
              {filtreActive}
            </span>
          )}
        </button>

        {(filtreActive > 0 || q) && (
          <button
            type="button"
            onClick={() => router.push("/membri")}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-ink-soft hover:text-rust"
          >
            <X className="h-3.5 w-3.5" /> Resetează
          </button>
        )}
      </div>

      {deschis && (
        <div className="mt-3 grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
          <div>
            <Label>Județ</Label>
            <Select value={judet} onChange={(e) => seteaza({ judet: e.target.value || null })}>
              <option value="">Oricare</option>
              {judete.map((j) => (
                <option key={j.cod} value={j.cod}>
                  {j.nume}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Firmă</Label>
            <div className="flex gap-1.5">
              {[
                { id: "", label: "Oricare" },
                { id: "cu", label: "Cu firmă" },
                { id: "fara", label: "Fără firmă" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => seteaza({ firma: opt.id || null })}
                  className={
                    "rounded-lg border px-3 py-2 text-xs font-semibold transition " +
                    (firma === opt.id
                      ? "border-seal bg-seal/10 text-seal"
                      : "border-line text-ink-soft hover:border-seal/40 hover:text-ink")
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label>Caută ajutor la</Label>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((opt) => {
                const activ = nevoiActive.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleNevoie(opt.id)}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
                      (activ ? "border-seal bg-seal text-white" : "border-line text-ink-soft hover:border-seal/40 hover:text-ink")
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
