"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, UserRound, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { incarcaAvatarProfil } from "@/lib/upload";
import { Input, Label, Select, Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { TagPicker, type TagOption } from "@/components/TagPicker";
import type { Judet } from "@/types/database";

/**
 * Pasul de profil public, imediat dupa crearea contului — obligatoriu, nu
 * doar recomandat. Prioritatea comunitatii e ca membrii sa se gaseasca usor
 * unii pe altii, iar un profil incomplet nu ajuta pe nimeni. Doar poza si
 * telefonul (deja cerut la pasul de cont) raman optionale.
 */
export function StepProfil({ onDone }: { onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [titlu, setTitlu] = useState("");
  const [firmaDeclarata, setFirmaDeclarata] = useState("");
  const [judetCod, setJudetCod] = useState("");
  const [oras, setOras] = useState("");
  const [bio, setBio] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [altText, setAltText] = useState("");

  const [judete, setJudete] = useState<Judet[]>([]);
  const [optiuniTag, setOptiuniTag] = useState<TagOption[]>([]);
  const [seIncarcaImagine, setSeIncarcaImagine] = useState(false);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("judete")
      .select("cod, nume")
      .order("nume")
      .then(({ data }) => setJudete((data as Judet[]) ?? []));
    supabase
      .from("categories")
      .select("id, name_ro")
      .is("parent_id", null)
      .order("ordine")
      .then(({ data }) =>
        setOptiuniTag(
          ((data as { id: string; name_ro: string }[]) ?? []).map((c) => ({ id: c.id, label: c.name_ro }))
        )
      );
  }, []);

  async function incarcaImagine(fisier: File) {
    setSeIncarcaImagine(true);
    setEroare(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesiune expirată. Reîncarcă pagina.");
      const { publicUrl } = await incarcaAvatarProfil(user.id, fisier);
      setAvatarUrl(publicUrl);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setSeIncarcaImagine(false);
    }
  }

  async function salveaza() {
    setEroare(null);

    if (!titlu.trim() || !firmaDeclarata.trim() || !judetCod || !oras.trim() || !bio.trim()) {
      setEroare("Completează toate câmpurile obligatorii — poza și telefonul sunt singurele opționale.");
      return;
    }

    setSeSalveaza(true);
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titlu,
          firma_declarata: firmaDeclarata,
          judet_cod: judetCod,
          oras,
          bio,
          cauta_suport: altText,
          cauta_suport_category_ids: tagIds,
          avatar_url: avatarUrl,
          public_vizibil: true,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setEroare(json?.error ?? "Nu am putut salva profilul. Încearcă din nou.");
        return;
      }
      onDone();
    } finally {
      setSeSalveaza(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-ink-soft">
        Așa te vor găsi ceilalți membri. Cu cât spui mai clar cine ești și la ce ai nevoie de
        ajutor, cu atât mai ușor te pot sprijini.
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft/40">
              <UserRound className="h-8 w-8" strokeWidth={1.5} />
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
          <Label className="mb-1">Poză de profil (opțional)</Label>
          <FieldHint>O poză reală crește mult șansa ca cineva să-ți scrie.</FieldHint>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label required>Rol / titlu</Label>
          <Input value={titlu} onChange={(e) => setTitlu(e.target.value)} placeholder="Ex: Fondator, Manager vânzări..." maxLength={120} />
        </div>
        <div>
          <Label required>Firma la care lucrezi</Label>
          <Input
            value={firmaDeclarata}
            onChange={(e) => setFirmaDeclarata(e.target.value)}
            placeholder="Numele firmei tale"
            maxLength={160}
          />
          <FieldHint>Chiar dacă n-o adaugi și verificată prin ANAF, spune-ne unde lucrezi.</FieldHint>
        </div>
        <div>
          <Label required>Județ</Label>
          <Select value={judetCod} onChange={(e) => setJudetCod(e.target.value)}>
            <option value="">Alege...</option>
            {judete.map((j) => (
              <option key={j.cod} value={j.cod}>
                {j.nume}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label required>Localitate</Label>
          <Input value={oras} onChange={(e) => setOras(e.target.value)} placeholder="Ex: Cluj-Napoca" maxLength={120} />
        </div>
      </div>

      <div>
        <Label required>Despre tine</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Câteva rânduri despre experiența ta..." maxLength={600} />
      </div>

      <TagPicker
        label="La ce ajutor ai nevoie din partea comunității?"
        hint="Alege ce ți se potrivește — te ajută pe alți membri să știe cum te pot sprijini."
        options={optiuniTag}
        selectedIds={tagIds}
        onChange={setTagIds}
        altText={altText}
        onAltTextChange={setAltText}
        altPlaceholder="Scrie aici ce nu se regăsește mai sus..."
      />

      <FieldError>{eroare}</FieldError>

      <div className="flex items-center justify-end gap-3 pt-1">
        <Button type="button" variant="seal" onClick={salveaza} disabled={seSalveaza}>
          {seSalveaza ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvează profilul
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
