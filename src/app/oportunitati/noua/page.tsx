"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, Loader2, Camera, X, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { incarcaImagineFirma } from "@/lib/upload";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError, FieldHint, FieldGroup } from "@/components/ui/Field";
import { useSettings } from "@/lib/settings/context";
import type { Category, Judet } from "@/types/database";

export default function OportunitateNouaPage() {
  const router = useRouter();
  const { t } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  const TIP_OPTIUNI = [
    { id: "proiect", label: t.opportunities.typeProject },
    { id: "achizitie", label: t.opportunities.typePurchase },
    { id: "colaborare", label: t.opportunities.typeCollaboration },
    { id: "cerere_servicii", label: t.opportunities.typeServiceRequest },
  ] as const;

  const [titlu, setTitlu] = useState("");
  const [descriere, setDescriere] = useState("");
  const [tip, setTip] = useState<string>("proiect");
  const [categoryId, setCategoryId] = useState("");
  const [judetCod, setJudetCod] = useState("");
  const [bugetMin, setBugetMin] = useState("");
  const [bugetMax, setBugetMax] = useState("");
  const [termen, setTermen] = useState("");
  const [imagineUrl, setImagineUrl] = useState<string | null>(null);

  const [categorii, setCategorii] = useState<Category[]>([]);
  const [judete, setJudete] = useState<Judet[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [seTrimite, setSeTrimite] = useState(false);
  const [seIncarcaImagine, setSeIncarcaImagine] = useState(false);
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
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();
      setCompanyId((data as { id: string } | null)?.id ?? null);
    });
  }, []);

  async function incarcaImagine(fisier: File) {
    if (!companyId) {
      setEroare(t.opportunities.needCompany);
      return;
    }
    setSeIncarcaImagine(true);
    setEroare(null);
    try {
      const { publicUrl } = await incarcaImagineFirma(companyId, "oportunitati", fisier);
      setImagineUrl(publicUrl);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setSeIncarcaImagine(false);
    }
  }

  async function trimite() {
    setEroare(null);
    if (!titlu.trim() || !descriere.trim()) {
      setEroare(t.common.required);
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
          imagine_url: imagineUrl,
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
      <p className="stamp-label text-seal">{t.opportunities.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{t.opportunities.postNew}</h1>
      <p className="mt-3 text-sm text-ink-soft">{t.opportunities.postSubtitle}</p>

      <div className="mt-8 space-y-5">
        <FieldGroup title={t.opportunities.sectionAbout}>
          <div>
            <Label required>{t.opportunities.fieldTitle}</Label>
            <Input value={titlu} onChange={(e) => setTitlu(e.target.value)} placeholder={t.opportunities.titlePlaceholder} />
          </div>
          <div>
            <Label required>{t.opportunities.fieldDescription}</Label>
            <Textarea value={descriere} onChange={(e) => setDescriere(e.target.value)} placeholder={t.opportunities.descriptionPlaceholder} />
          </div>
          <div>
            <Label>{t.opportunities.fieldType}</Label>
            <Select value={tip} onChange={(e) => setTip(e.target.value)}>
              {TIP_OPTIUNI.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </FieldGroup>

        <FieldGroup title={t.opportunities.imageOptional}>
          {imagineUrl ? (
            <div className="relative aspect-[16/9] w-full max-w-xs overflow-hidden rounded-xl bg-ink/5">
              <Image src={imagineUrl} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => setImagineUrl(null)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy/70 text-white transition hover:bg-navy"
                aria-label={t.opportunities.removeImage}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={seIncarcaImagine}
              className="flex aspect-[16/9] w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line-strong text-ink-soft/60 transition hover:border-seal/50 hover:text-seal disabled:opacity-60"
            >
              {seIncarcaImagine ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              <span className="text-xs font-medium">{t.opportunities.addImage}</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) incarcaImagine(f);
            }}
          />
          <FieldHint>
            <Camera className="mr-1 inline h-3 w-3" />
            {t.opportunities.imageHint}
          </FieldHint>
        </FieldGroup>

        <FieldGroup title={t.opportunities.sectionDetails}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t.opportunities.fieldDomain}</Label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">{t.opportunities.anyDomain}</option>
                {categorii.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ro}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{t.opportunities.fieldCounty}</Label>
              <Select value={judetCod} onChange={(e) => setJudetCod(e.target.value)}>
                <option value="">{t.opportunities.anywhere}</option>
                {judete.map((j) => (
                  <option key={j.cod} value={j.cod}>
                    {j.nume}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{t.opportunities.fieldBudgetMin}</Label>
              <Input type="number" min={0} value={bugetMin} onChange={(e) => setBugetMin(e.target.value)} />
            </div>
            <div>
              <Label>{t.opportunities.fieldBudgetMax}</Label>
              <Input type="number" min={0} value={bugetMax} onChange={(e) => setBugetMax(e.target.value)} />
            </div>
            <div>
              <Label>{t.opportunities.fieldDeadline}</Label>
              <Input type="date" value={termen} onChange={(e) => setTermen(e.target.value)} />
              <FieldHint>{t.opportunities.deadlineHint}</FieldHint>
            </div>
          </div>
        </FieldGroup>

        <FieldError>{eroare}</FieldError>

        <Button variant="seal" size="lg" onClick={trimite} disabled={seTrimite} className="w-full sm:w-auto">
          {seTrimite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {t.opportunities.publish}
        </Button>
      </div>
    </div>
  );
}
