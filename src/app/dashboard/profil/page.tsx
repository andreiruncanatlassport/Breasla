"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, Loader2, Check, UserRound, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { incarcaAvatarProfil } from "@/lib/upload";
import { Input, Label, Textarea, FieldError, FieldHint, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SkeletonPage } from "@/components/ui/Skeleton";

interface ProfilForm {
  id: string;
  nume_complet: string;
  avatar_url: string | null;
  titlu: string | null;
  bio: string | null;
  oras: string | null;
  cauta_suport: string | null;
  public_vizibil: boolean;
}

export default function DashboardProfilPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profil, setProfil] = useState<ProfilForm | null>(null);
  const [seIncarcaImagine, setSeIncarcaImagine] = useState(false);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [salvat, setSalvat] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, nume_complet, avatar_url, titlu, bio, oras, cauta_suport, public_vizibil")
        .eq("id", user.id)
        .single();
      setProfil(data as ProfilForm);
    });
  }, [router]);

  function update(patch: Partial<ProfilForm>) {
    setProfil((prev) => (prev ? { ...prev, ...patch } : prev));
    setSalvat(false);
  }

  async function incarcaImagine(fisier: File) {
    if (!profil) return;
    setSeIncarcaImagine(true);
    setEroare(null);
    try {
      const { publicUrl } = await incarcaAvatarProfil(profil.id, fisier);
      update({ avatar_url: publicUrl });
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setSeIncarcaImagine(false);
    }
  }

  async function salveaza() {
    if (!profil) return;
    setSeSalveaza(true);
    setEroare(null);
    try {
      const res = await fetch("/api/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nume_complet: profil.nume_complet,
          titlu: profil.titlu,
          bio: profil.bio,
          oras: profil.oras,
          cauta_suport: profil.cauta_suport,
          avatar_url: profil.avatar_url,
          public_vizibil: profil.public_vizibil,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut salva profilul.");
        return;
      }
      setSalvat(true);
    } finally {
      setSeSalveaza(false);
    }
  }

  if (!profil) return <SkeletonPage />;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> Contul meu
      </Link>

      <p className="stamp-label mt-6 text-seal">Pagina de Membri</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Profilul meu public</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Cum te văd ceilalți membri în directorul comunității. Telefonul și emailul personal nu sunt
        niciodată afișate public.
      </p>

      <div className="mt-8 space-y-5">
        <FieldGroup>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line"
            >
              {profil.avatar_url ? (
                <Image src={profil.avatar_url} alt="" fill className="object-cover" unoptimized />
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
              <FieldHint>JPG sau PNG, sub 5MB.</FieldHint>
            </div>
          </div>

          <div>
            <Label>Nume complet</Label>
            <Input value={profil.nume_complet} onChange={(e) => update({ nume_complet: e.target.value })} />
          </div>

          <div>
            <Label>Titlu / rol</Label>
            <Input
              value={profil.titlu ?? ""}
              onChange={(e) => update({ titlu: e.target.value })}
              placeholder="Ex: Fondator, Manager vânzări..."
            />
          </div>

          <div>
            <Label>Oraș</Label>
            <Input value={profil.oras ?? ""} onChange={(e) => update({ oras: e.target.value })} placeholder="Ex: Cluj-Napoca" />
          </div>

          <div>
            <Label>Despre tine</Label>
            <Textarea
              value={profil.bio ?? ""}
              onChange={(e) => update({ bio: e.target.value })}
              placeholder="Câteva rânduri despre experiența ta..."
              maxLength={600}
            />
          </div>

          <div>
            <Label>La ce ajutor ai nevoie din partea comunității?</Label>
            <Textarea
              value={profil.cauta_suport ?? ""}
              onChange={(e) => update({ cauta_suport: e.target.value })}
              placeholder="Ex: networking, consultanță pe vânzări sau marketing, recomandări de contabil..."
              maxLength={300}
            />
            <FieldHint>
              Personal, nu al firmei — despre tine ca persoană, nu despre ce oferă firma ta. Ajută
              alți membri să știe cum te pot sprijini.
            </FieldHint>
          </div>
        </FieldGroup>

        <FieldGroup title="Vizibilitate">
          <button
            type="button"
            onClick={() => update({ public_vizibil: !profil.public_vizibil })}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm text-ink">
              {profil.public_vizibil ? <Eye className="h-4 w-4 text-teal" /> : <EyeOff className="h-4 w-4 text-ink-soft" />}
              Apar în directorul de <strong>Membri</strong>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${profil.public_vizibil ? "bg-teal" : "bg-ink/15"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  profil.public_vizibil ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
          <FieldHint>Dacă dezactivezi, ceilalți nu te mai găsesc în /membri, dar poți în continuare trimite mesaje.</FieldHint>
        </FieldGroup>

        <FieldError>{eroare}</FieldError>

        <div className="flex items-center gap-3">
          <Button variant="seal" onClick={salveaza} disabled={seSalveaza}>
            {seSalveaza ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Salvează
          </Button>
          {salvat && <span className="text-sm font-medium text-teal">Salvat.</span>}
        </div>
      </div>
    </div>
  );
}
