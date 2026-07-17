"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label, Select, Input, Textarea, FieldError } from "@/components/ui/Field";
import type { Category } from "@/types/database";
import type { WizardFormState, WizardNevoieOferta } from "../types";

interface Props {
  form: WizardFormState;
  update: (patch: Partial<WizardFormState>) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  seTrimite: boolean;
  eroareTrimitere: string | null;
}

function ListaEditabila({
  items,
  categorii,
  onChange,
  placeholderNota,
}: {
  items: WizardNevoieOferta[];
  categorii: Category[];
  onChange: (items: WizardNevoieOferta[]) => void;
  placeholderNota: string;
}) {
  function adauga() {
    onChange([...items, { category_id: null, nota: "" }]);
  }
  function elimina(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function actualizeaza(i: number, patch: Partial<WizardNevoieOferta>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Select
            className="w-48 shrink-0"
            value={item.category_id ?? ""}
            onChange={(e) => actualizeaza(i, { category_id: e.target.value || null })}
          >
            <option value="">Domeniu (opțional)</option>
            {categorii.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ro}</option>
            ))}
          </Select>
          <Input
            placeholder={placeholderNota}
            value={item.nota}
            onChange={(e) => actualizeaza(i, { nota: e.target.value })}
          />
          <button
            type="button"
            onClick={() => elimina(i)}
            className="shrink-0 rounded-lg border border-line px-2.5 text-ink-soft hover:border-rust hover:text-rust"
            aria-label="Șterge"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={adauga}>
        <Plus className="h-3.5 w-3.5" /> Adaugă
      </Button>
    </div>
  );
}

export function StepNevoi({ form, update, onBack, onSubmit, seTrimite, eroareTrimitere }: Props) {
  const [categorii, setCategorii] = useState<Category[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("id, slug, name_ro, name_en, parent_id, ordine, created_at")
      .order("ordine")
      .then(({ data }) => setCategorii((data as Category[]) ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Label>De ce ajutor ai avea nevoie din partea grupului?</Label>
        <ListaEditabila
          items={form.nevoi}
          categorii={categorii}
          onChange={(nevoi) => update({ nevoi })}
          placeholderNota="ex: caut un contabil de încredere"
        />
      </div>

      <div>
        <Label>În ce domenii poți ajuta tu alte firme?</Label>
        <ListaEditabila
          items={form.oferte}
          categorii={categorii}
          onChange={(oferte) => update({ oferte })}
          placeholderNota="ex: pot ajuta cu instalații electrice"
        />
      </div>

      <div>
        <Label>Ce speri să obții din acest grup? (opțional)</Label>
        <Textarea
          value={form.cum_poate_ajuta_grupul}
          onChange={(e) => update({ cum_poate_ajuta_grupul: e.target.value })}
          placeholder="Câteva rânduri despre ce te-ar ajuta cel mai mult..."
        />
      </div>

      <FieldError>{eroareTrimitere}</FieldError>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={seTrimite}>
          Înapoi
        </Button>
        <Button type="button" onClick={onSubmit} disabled={seTrimite}>
          {seTrimite ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Se trimite...
            </>
          ) : (
            "Trimite înregistrarea"
          )}
        </Button>
      </div>
    </div>
  );
}
