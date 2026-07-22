"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input, Label, FieldHint } from "@/components/ui/Field";

export interface TagOption {
  id: string;
  label: string;
}

interface Props {
  options: TagOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  altText: string;
  onAltTextChange: (text: string) => void;
  label: string;
  hint?: string;
  altPlaceholder?: string;
  altLabel?: string;
  searchThreshold?: number;
}

/**
 * Chip-uri predefinite (multi-select) + o optiune fixa "Altele" care
 * deschide un camp de text liber. Peste un anumit numar de optiuni apare si
 * un search ca sa le gasesti rapid — stil LinkedIn skills, cerut explicit in
 * testare. Folosit atat pentru nevoile/ofertele firmei, cat si pentru "la ce
 * ajutor are nevoie" un membru — aceeasi taxonomie de domenii peste tot.
 */
export function TagPicker({
  options,
  selectedIds,
  onChange,
  altText,
  onAltTextChange,
  label,
  hint,
  altPlaceholder = "Scrie aici, cu cuvintele tale...",
  altLabel = "Altele",
  searchThreshold = 8,
}: Props) {
  const [cautare, setCautare] = useState("");
  const [altDeschis, setAltDeschis] = useState(altText.trim().length > 0);

  const q = cautare.trim().toLowerCase();
  const filtrate = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  }

  return (
    <div>
      <Label>{label}</Label>
      {hint && <FieldHint>{hint}</FieldHint>}

      {options.length > searchThreshold && (
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft/50" />
          <Input value={cautare} onChange={(e) => setCautare(e.target.value)} placeholder="Caută..." className="h-9 pl-8 text-sm" />
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {filtrate.map((opt) => {
          const activ = selectedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
                (activ ? "border-seal bg-seal text-white" : "border-line text-ink-soft hover:border-seal/40 hover:text-ink")
              }
            >
              {opt.label}
            </button>
          );
        })}
        {filtrate.length === 0 && <p className="text-xs text-ink-soft">Niciun rezultat pentru „{cautare}”.</p>}

        <button
          type="button"
          onClick={() => setAltDeschis((v) => !v)}
          className={
            "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
            (altDeschis || altText.trim()
              ? "border-seal bg-seal/10 text-seal"
              : "border-dashed border-line-strong text-ink-soft hover:border-seal/40 hover:text-ink")
          }
        >
          + {altLabel}
        </button>
      </div>

      {altDeschis && (
        <div className="mt-2.5 flex items-start gap-2">
          <Input value={altText} onChange={(e) => onAltTextChange(e.target.value)} placeholder={altPlaceholder} maxLength={200} />
          <button
            type="button"
            onClick={() => {
              onAltTextChange("");
              setAltDeschis(false);
            }}
            className="mt-2.5 shrink-0 text-ink-soft/50 hover:text-rust"
            aria-label="Șterge"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
