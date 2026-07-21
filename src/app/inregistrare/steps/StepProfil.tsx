"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, UserRound, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { incarcaAvatarProfil } from "@/lib/upload";
import { Input, Label, Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

/**
 * Pasul de profil public, imediat dupa crearea contului. Prioritatea
 * comunitatii e ca membrii sa se gaseasca usor unii pe altii — un profil
 * completat (poza, rol, oras, la ce ajutor are nevoie) face exact asta.
 */
export function StepProfil({ onDone }: { onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [titlu, setTitlu] = useState("");
  const [oras, setOras] = useState("");
  const [bio, setBio] = useState("");
  const [cautaSuport, setCautaSuport] = useState("");
  const [seIncarcaImagine, setSeIncarcaImagine] = useState(false);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

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
    setSeSalveaza(true);
    setEroare(null);
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titlu,
          oras,
          bio,
          cauta_suport: cautaSuport,
          avatar_url: avatarUrl,
          public_vizibil: true,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setEroare(json?.error ?? "Nu am putut salva profilul. Poți încerca din nou sau completa mai târziu din cont.");
        return;
      }
      onDone();
    } finally {
      setSeSalveaza(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm leading-relaxed text-ink-soft">
          Așa te vor găsi ceilalți membri. Cu cât spui mai clar cine ești și la ce ai nevoie de
          ajutor, cu atât mai ușor te pot sprijini. Telefonul și emailul rămân private.
        </p>
      </div>

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
          <Label className="mb-1">Poză de profil</Label>
          <FieldHint>O poză reală crește mult șansa ca cineva să-ți scrie.</FieldHint>
        </div>
      </div>

      <div>
        <Label>Titlu / rol</Label>
        <Input value={titlu} onChange={(e) => setTitlu(e.target.value)} placeholder="Ex: Fondator, Manager vânzări..." maxLength={120} />
      </div>

      <div>
        <Label>Oraș</Label>
        <Input value={oras} onChange={(e) => setOras(e.target.value)} placeholder="Ex: Cluj-Napoca" maxLength={120} />
      </div>

      <div>
        <Label>Despre tine</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Câteva rânduri despre experiența ta..." maxLength={600} />
      </div>

      <div>
        <Label>La ce ajutor ai nevoie din partea comunității?</Label>
        <Textarea
          value={cautaSuport}
          onChange={(e) => setCautaSuport(e.target.value)}
          placeholder="Ex: networking, consultanță pe vânzări sau marketing, recomandări de contabil..."
          maxLength={300}
        />
        <FieldHint>Despre tine ca persoană — comunitatea te poate sprijini doar dacă știe la ce.</FieldHint>
      </div>

      <FieldError>{eroare}</FieldError>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button type="button" variant="ghost" onClick={onDone}>
          Completez mai târziu
        </Button>
        <Button type="button" variant="seal" onClick={salveaza} disabled={seSalveaza}>
          {seSalveaza ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvează profilul
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
