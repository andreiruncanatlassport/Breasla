"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label, Input, Select, FieldHint } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import type { Category } from "@/types/database";
import type { CategoryNode, WizardFormState } from "../types";

interface Props {
  form: WizardFormState;
  update: (patch: Partial<WizardFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function buildTree(flat: Category[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  flat.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else if (!node.parent_id) {
      roots.push(node);
    }
  });
  return roots;
}

export function StepDomenii({ form, update, onNext, onBack }: Props) {
  const [tree, setTree] = useState<CategoryNode[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("id, slug, name_ro, name_en, parent_id, ordine, created_at")
      .order("ordine")
      .then(({ data }) => setTree(buildTree((data as Category[]) ?? [])));
  }, []);

  function isChecked(categoryId: string) {
    return form.categorii.some((c) => c.category_id === categoryId);
  }

  function toggle(categoryId: string) {
    if (isChecked(categoryId)) {
      update({ categorii: form.categorii.filter((c) => c.category_id !== categoryId) });
    } else {
      update({
        categorii: [
          ...form.categorii,
          { category_id: categoryId, is_primary: form.categorii.length === 0 },
        ],
      });
    }
  }

  function setPrimary(categoryId: string) {
    update({
      categorii: form.categorii.map((c) => ({ ...c, is_primary: c.category_id === categoryId })),
    });
  }

  const areDomeniu = form.categorii.length > 0;
  const areDomeniuPrincipal = form.categorii.some((c) => c.is_primary);

  return (
    <div className="space-y-6">
      <div>
        <Label required>Domenii de activitate</Label>
        <FieldHint>
          Bifează toate domeniile relevante. Alege un domeniu principal (radio) — el va apărea
          primul pe profilul firmei.
        </FieldHint>

        <div className="mt-3 max-h-96 space-y-4 overflow-y-auto rounded-lg border border-line bg-paper-white p-4">
          {tree.map((parent) => (
            <div key={parent.id}>
              <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={isChecked(parent.id)}
                  onChange={() => toggle(parent.id)}
                  className="rounded border-line accent-seal"
                />
                {parent.name_ro}
                {isChecked(parent.id) && (
                  <button
                    type="button"
                    onClick={() => setPrimary(parent.id)}
                    className={
                      "ml-2 rounded-full px-2 py-0.5 text-xs font-medium " +
                      (form.categorii.find((c) => c.category_id === parent.id)?.is_primary
                        ? "bg-seal text-paper-white"
                        : "bg-ink/8 text-ink/60 hover:bg-ink/15")
                    }
                  >
                    principal
                  </button>
                )}
              </label>
              {parent.children.length > 0 && (
                <div className="ml-6 mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {parent.children.map((child) => (
                    <label key={child.id} className="flex items-center gap-2 text-sm text-ink/75">
                      <input
                        type="checkbox"
                        checked={isChecked(child.id)}
                        onChange={() => toggle(child.id)}
                        className="rounded border-line accent-seal"
                      />
                      {child.name_ro}
                      {isChecked(child.id) && (
                        <button
                          type="button"
                          onClick={() => setPrimary(child.id)}
                          className={
                            "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
                            (form.categorii.find((c) => c.category_id === child.id)?.is_primary
                              ? "bg-seal text-paper-white"
                              : "bg-ink/8 text-ink/50 hover:bg-ink/15")
                          }
                        >
                          principal
                        </button>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <Label>Cifră de afaceri</Label>
        {form.cifra_afaceri_sursa === "anaf_auto" && form.cifra_afaceri_valoare != null ? (
          <div className="text-sm">
            <p className="text-ink">
              Preluată automat din bilanțul depus la ANAF pentru anul{" "}
              <strong>{form.cifra_afaceri_an}</strong>:{" "}
              <strong className="font-mono-num">
                {form.cifra_afaceri_valoare.toLocaleString("ro-RO")} lei
              </strong>
            </p>
            <button
              type="button"
              onClick={() => update({ cifra_afaceri_sursa: "manual", cifra_afaceri_valoare: null })}
              className="mt-2 text-xs font-medium text-seal hover:underline"
            >
              Nu e corectă / vreau s-o introduc manual
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ink/60">
              Nu am găsit un bilanț public la ANAF pentru această firmă (posibil, firmă nouă).
              Poți introduce cifra de afaceri manual, sau poți sări peste acest pas.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={form.cifra_afaceri_an ?? ""}
                onChange={(e) => update({ cifra_afaceri_an: Number(e.target.value) })}
              >
                <option value="">An</option>
                {Array.from({ length: 5 }).map((_, i) => {
                  const an = new Date().getFullYear() - 1 - i;
                  return <option key={an} value={an}>{an}</option>;
                })}
              </Select>
              <Input
                type="number"
                min={0}
                placeholder="Valoare (lei)"
                value={form.cifra_afaceri_valoare ?? ""}
                onChange={(e) =>
                  update({
                    cifra_afaceri_valoare: e.target.value ? Number(e.target.value) : null,
                    cifra_afaceri_sursa: "manual",
                  })
                }
              />
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>Înapoi</Button>
        <Button type="button" onClick={onNext} disabled={!areDomeniu || !areDomeniuPrincipal}>
          Continuă
        </Button>
      </div>
    </div>
  );
}
