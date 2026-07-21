"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label, Textarea, FieldError } from "@/components/ui/Field";
import { TagPicker, type TagOption } from "@/components/TagPicker";
import type { WizardFormState, WizardNevoieOferta } from "../types";

interface Props {
  form: WizardFormState;
  update: (patch: Partial<WizardFormState>) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  seTrimite: boolean;
  eroareTrimitere: string | null;
}

/** Domeniile bifate (chip-uri) + nota libera de la "Altele" (category_id null),
    impachetate/despachetate din/in forma WizardNevoieOferta[] asteptata de API. */
function idDinItems(items: WizardNevoieOferta[]): string[] {
  return items.filter((i) => i.category_id).map((i) => i.category_id as string);
}
function altDinItems(items: WizardNevoieOferta[]): string {
  return items.find((i) => !i.category_id)?.nota ?? "";
}
function itemsDinIdSiAlt(ids: string[], alt: string): WizardNevoieOferta[] {
  const tagged: WizardNevoieOferta[] = ids.map((id) => ({ category_id: id, nota: "" }));
  return alt.trim() ? [...tagged, { category_id: null, nota: alt.trim() }] : tagged;
}

export function StepNevoi({ form, update, onBack, onSubmit, seTrimite, eroareTrimitere }: Props) {
  const [optiuni, setOptiuni] = useState<TagOption[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("id, name_ro")
      .is("parent_id", null)
      .order("ordine")
      .then(({ data }) =>
        setOptiuni(((data as { id: string; name_ro: string }[]) ?? []).map((c) => ({ id: c.id, label: c.name_ro })))
      );
  }, []);

  return (
    <div className="space-y-6">
      <TagPicker
        label="De ce ajutor ai avea nevoie din partea grupului?"
        options={optiuni}
        selectedIds={idDinItems(form.nevoi)}
        onChange={(ids) => update({ nevoi: itemsDinIdSiAlt(ids, altDinItems(form.nevoi)) })}
        altText={altDinItems(form.nevoi)}
        onAltTextChange={(text) => update({ nevoi: itemsDinIdSiAlt(idDinItems(form.nevoi), text) })}
        altPlaceholder="ex: caut un contabil de încredere"
      />

      <TagPicker
        label="În ce domenii poate ajuta firma ta pe alții?"
        options={optiuni}
        selectedIds={idDinItems(form.oferte)}
        onChange={(ids) => update({ oferte: itemsDinIdSiAlt(ids, altDinItems(form.oferte)) })}
        altText={altDinItems(form.oferte)}
        onAltTextChange={(text) => update({ oferte: itemsDinIdSiAlt(idDinItems(form.oferte), text) })}
        altPlaceholder="ex: pot ajuta cu instalații electrice"
      />

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
