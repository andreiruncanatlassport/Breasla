"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
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
  const [cautare, setCautare] = useState("");

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

  // filtram arborele dupa textul cautat — pastram un parinte daca el insusi
  // se potriveste, sau daca oricare dintre copiii lui se potriveste
  const q = cautare.trim().toLowerCase();
  const treeFiltrat = q
    ? tree
        .map((parent) => {
          const parentMatch = parent.name_ro.toLowerCase().includes(q);
          const childrenMatch = parent.children.filter((c) => c.name_ro.toLowerCase().includes(q));
          if (parentMatch) return parent;
          if (childrenMatch.length > 0) return { ...parent, children: childrenMatch };
          return null;
        })
        .filter((p): p is CategoryNode => p !== null)
    : tree;

  return (
    <div className="space-y-6">
      <div>
        <Label required>Domenii de activitate</Label>
        <FieldHint>
          Bifează toate domeniile relevante (poți bifa oricâte, independent unele de altele —
          bifarea unei categorii-părinte nu bifează automat subcategoriile). Apoi alege un singur
          domeniu principal dintre cele bifate — el va apărea primul pe profilul firmei.
        </FieldHint>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/50" />
          <Input
            value={cautare}
            onChange={(e) => setCautare(e.target.value)}
            placeholder="Caută un domeniu..."
            className="pl-9"
          />
        </div>

        <div className="mt-3 max-h-96 space-y-4 overflow-y-auto rounded-lg border border-line bg-surface p-4">
          {treeFiltrat.length === 0 && (
            <p className="text-sm text-ink-soft">Niciun domeniu găsit pentru „{cautare}”.</p>
          )}
          {treeFiltrat.map((parent) => (
            <div key={parent.id}>
              <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={isChecked(parent.id)}
                  onChange={() => toggle(parent.id)}
                  className="rounded border-line accent-seal"
                />
                {parent.name_ro}
              </label>
              {isChecked(parent.id) && (
                <button
                  type="button"
                  onClick={() => setPrimary(parent.id)}
                  className={
                    "ml-6 mt-1 rounded-full px-2 py-0.5 text-xs font-medium " +
                    (form.categorii.find((c) => c.category_id === parent.id)?.is_primary
                      ? "bg-seal text-white"
                      : "bg-ink/8 text-ink-soft hover:bg-ink/15")
                  }
                >
                  domeniu principal
                </button>
              )}
              {parent.children.length > 0 && (
                <div className="ml-6 mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {parent.children.map((child) => (
                    <div key={child.id}>
                      <label className="flex items-center gap-2 text-sm text-ink-soft">
                        <input
                          type="checkbox"
                          checked={isChecked(child.id)}
                          onChange={() => toggle(child.id)}
                          className="rounded border-line accent-seal"
                        />
                        {child.name_ro}
                      </label>
                      {isChecked(child.id) && (
                        <button
                          type="button"
                          onClick={() => setPrimary(child.id)}
                          className={
                            "ml-6 mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
                            (form.categorii.find((c) => c.category_id === child.id)?.is_primary
                              ? "bg-seal text-white"
                              : "bg-ink/8 text-ink-soft hover:bg-ink/15")
                          }
                        >
                          domeniu principal
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="domenii-altele">Altul — nu îți găsești domeniul în listă?</Label>
          <Input
            id="domenii-altele"
            value={form.domenii_altele}
            onChange={(e) => update({ domenii_altele: e.target.value })}
            placeholder="Scrie domeniul tău aici, cu cuvintele tale..."
            maxLength={300}
          />
          <FieldHint>
            Apare pe profilul firmei lângă domeniile bifate. Tot trebuie să bifezi cel puțin un
            domeniu din listă (cel mai apropiat) ca domeniu principal.
          </FieldHint>
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
            <p className="text-sm text-ink-soft">
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
