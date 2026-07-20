"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError, FieldHint, FieldGroup } from "@/components/ui/Field";
import type { Category, Judet } from "@/types/database";

const TIP_OPTIUNI = [
  { id: "proiect", label: "Proiect" },
  { id: "achizitie", label: "Achiziție" },
  { id: "colaborare", label: "Colaborare" },
  { id: "cerere_servicii", label: "Cerere de servicii" },
] as const;

export default function OportunitateNouaPage() {
  const router = useRouter();

  const [titlu, setTitlu] = useState("");
  const [descriere, setDescriere] = useState("");
  const [tip, setTip] = useState<string>("proiect");
  const [categoryId, setCategoryId] = useState("");
  const [judetCod, setJudetCod] = useState("");
  const [bugetMin, setBugetMin] = useState("");
  const [bugetMax, setBugetMax] = useState("");
  const [termen, setTermen] = useState("");

  const [categorii, setCategorii] = useState<Category[]>([]);
  const [judete, setJudete] = useState<Judet[]>([]);
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

  async function trimite() {
    setEroare(null);
    if (!titlu.trim() || !descriere.trim()) {
      setEroare("Titlul și descrierea sunt obligatorii.");
      return;
    }
    setSeTrimite(true);
    try {
      const res = await fetch("/api/oportunitati", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titlu: titlu.trim(),
          descriere: descriere.trim(),
          tip,
          category_id: categoryId || null,
          judet_cod: judetCod || null,
          buget_min: bugetMin ? Number(bugetMin) : null,
          buget_max: bugetMax ? Number(bugetMax) : null,
          termen_limita: termen || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut publica oportunitatea.");
        return;
      }
      router.push(`/oportunitati/${json.data.id}`);
    } finally {
      setSeTrimite(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <p className="stamp-label text-seal">Board public</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Postează o oportunitate</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Vizibilă tuturor firmelor din Rețeaua Antreprenorilor Creștini, până când o închizi. Diferă de o Cerere de ofertă
        (trimisă privat către firme alese de tine) — aici oricine poate răspunde.
      </p>

      <div className="mt-8 space-y-5">
        <FieldGroup title="Despre ce e vorba">
          <div>
            <Label required>Titlu</Label>
            <Input value={titlu} onChange={(e) => setTitlu(e.target.value)} placeholder="Ex: Caut subcontractor instalații electrice" />
          </div>
          <div>
            <Label required>Descriere</Label>
            <Textarea value={descriere} onChange={(e) => setDescriere(e.target.value)} placeholder="Detaliază nevoia, contextul, ce aștepți de la colaborare..." />
          </div>
          <div>
            <Label>Tip</Label>
            <Select value={tip} onChange={(e) => setTip(e.target.value)}>
              {TIP_OPTIUNI.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </FieldGroup>

        <FieldGroup title="Detalii (opțional)">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Domeniu</Label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Oricare</option>
                {categorii.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ro}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Județ</Label>
              <Select value={judetCod} onChange={(e) => setJudetCod(e.target.value)}>
                <option value="">Oriunde</option>
                {judete.map((j) => (
                  <option key={j.cod} value={j.cod}>
                    {j.nume}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Buget minim (€)</Label>
              <Input type="number" min={0} value={bugetMin} onChange={(e) => setBugetMin(e.target.value)} />
            </div>
            <div>
              <Label>Buget maxim (€)</Label>
              <Input type="number" min={0} value={bugetMax} onChange={(e) => setBugetMax(e.target.value)} />
            </div>
            <div>
              <Label>Termen limită</Label>
              <Input type="date" value={termen} onChange={(e) => setTermen(e.target.value)} />
              <FieldHint>Data până la care aștepți răspunsuri.</FieldHint>
            </div>
          </div>
        </FieldGroup>

        <FieldError>{eroare}</FieldError>

        <Button variant="seal" size="lg" onClick={trimite} disabled={seTrimite} className="w-full sm:w-auto">
          {seTrimite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publică oportunitatea
        </Button>
      </div>
    </div>
  );
}
