"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Send, Briefcase, X } from "lucide-react";
import { incarcaImagineFirma } from "@/lib/upload";
import { Input, Label, Select, Textarea, FieldError, FieldHint, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/lib/settings/context";

interface Props {
  companii: { id: string; denumire: string }[];
  judete: { cod: string; nume: string }[];
  categorii: { id: string; label: string }[];
}

export function OpportunityForm({ companii, judete, categorii }: Props) {
  const router = useRouter();
  const { t } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  const [companyId, setCompanyId] = useState(companii[0]?.id ?? "");
  const [titlu, setTitlu] = useState("");
  const [descriere, setDescriere] = useState("");
  const [tip, setTip] = useState("proiect");
  const [categoryId, setCategoryId] = useState("");
  const [judetCod, setJudetCod] = useState("");
  const [bugetMin, setBugetMin] = useState("");
  const [bugetMax, setBugetMax] = useState("");
  const [termenLimita, setTermenLimita] = useState("");
  const [imagineUrl, setImagineUrl] = useState<string | null>(null);
  const [seIncarcaImagine, setSeIncarcaImagine] = useState(false);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  const TIP_OPTIUNI = [
    { id: "proiect", label: t.opportunities.typeProject },
    { id: "achizitie", label: t.opportunities.typePurchase },
    { id: "colaborare", label: t.opportunities.typeCollaboration },
    { id: "cerere_servicii", label: t.opportunities.typeServiceRequest },
  ];

  async function incarcaImagine(fisier: File) {
    if (!companyId) return;
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

  async function publica() {
    if (!companyId) {
      setEroare(t.opportunities.needCompany);
      return;
    }
    if (!titlu.trim() || !descriere.trim()) {
      setEroare(t.opportunities.respondError);
      return;
    }
    setSeSalveaza(true);
    setEroare(null);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          titlu,
          descriere,
          tip,
          category_id: categoryId || null,
          judet_cod: judetCod || null,
          buget_min: bugetMin || null,
          buget_max: bugetMax || null,
          termen_limita: termenLimita || null,
          imagine_url: imagineUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut publica oportunitatea.");
        return;
      }
      router.push(`/oportunitati/${json.data.id}`);
      router.refresh();
    } finally {
      setSeSalveaza(false);
    }
  }

  return (
    <div className="space-y-5">
      {companii.length > 1 && (
        <div>
          <Label required>Postezi ca firma</Label>
          <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companii.map((c) => (
              <option key={c.id} value={c.id}>
                {c.denumire}
              </option>
            ))}
          </Select>
        </div>
      )}

      <FieldGroup title={t.opportunities.sectionAbout}>
        <div>
          <Label required>{t.opportunities.fieldTitle}</Label>
          <Input value={titlu} onChange={(e) => setTitlu(e.target.value)} placeholder={t.opportunities.titlePlaceholder} />
        </div>
        <div>
          <Label required>{t.opportunities.fieldDescription}</Label>
          <Textarea
            value={descriere}
            onChange={(e) => setDescriere(e.target.value)}
            className="min-h-[160px]"
            placeholder={t.opportunities.descriptionPlaceholder}
          />
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
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!companyId}
            className="group relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-ink/5 ring-1 ring-inset ring-line disabled:opacity-50"
          >
            {imagineUrl ? (
              <Image src={imagineUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-soft/40">
                <Briefcase className="h-6 w-6" strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-navy/50 opacity-0 transition group-hover:opacity-100">
              {seIncarcaImagine ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
            </div>
          </button>
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
          <div>
            <FieldHint>{t.opportunities.imageHint}</FieldHint>
            {imagineUrl && (
              <button type="button" onClick={() => setImagineUrl(null)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-rust hover:underline">
                <X className="h-3 w-3" /> {t.opportunities.removeImage}
              </button>
            )}
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title={t.opportunities.sectionDetails}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t.opportunities.fieldDomain}</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t.opportunities.anyDomain}</option>
              {categorii.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
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
        </div>
        <div className="max-w-[220px]">
          <Label>{t.opportunities.fieldDeadline}</Label>
          <Input type="date" value={termenLimita} onChange={(e) => setTermenLimita(e.target.value)} />
          <FieldHint>{t.opportunities.deadlineHint}</FieldHint>
        </div>
      </FieldGroup>

      <FieldError>{eroare}</FieldError>

      <Button variant="seal" onClick={publica} disabled={seSalveaza}>
        {seSalveaza ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t.opportunities.publish}
      </Button>
    </div>
  );
}
