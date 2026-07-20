"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Send, Newspaper, Trash2 } from "lucide-react";
import { incarcaImagineSite } from "@/lib/upload";
import { Input, Label, Textarea, FieldError, FieldHint, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { NewsArticle } from "@/types/database";

export function NewsForm({ initial }: { initial?: NewsArticle }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const editare = Boolean(initial);

  const [titlu, setTitlu] = useState(initial?.titlu ?? "");
  const [rezumat, setRezumat] = useState(initial?.rezumat ?? "");
  const [continut, setContinut] = useState(initial?.continut ?? "");
  const [imagineUrl, setImagineUrl] = useState(initial?.imagine_url ?? null);
  const [seIncarcaImagine, setSeIncarcaImagine] = useState(false);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function incarcaImagine(fisier: File) {
    setSeIncarcaImagine(true);
    setEroare(null);
    try {
      const { publicUrl } = await incarcaImagineSite("stiri", initial?.id ?? "temp", fisier);
      setImagineUrl(publicUrl);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setSeIncarcaImagine(false);
    }
  }

  async function salveaza(status: "draft" | "publicat") {
    if (!titlu.trim() || !continut.trim()) {
      setEroare("Titlul și conținutul sunt obligatorii.");
      return;
    }
    setSeSalveaza(true);
    setEroare(null);
    try {
      const body = { titlu, rezumat, continut, imagine_url: imagineUrl, status };
      const res = await fetch(editare ? `/api/admin/stiri/${initial!.id}` : "/api/admin/stiri", {
        method: editare ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut salva știrea.");
        return;
      }
      router.push("/admin/stiri");
      router.refresh();
    } finally {
      setSeSalveaza(false);
    }
  }

  async function sterge() {
    if (!initial || !confirm("Ștergi definitiv această știre?")) return;
    await fetch(`/api/admin/stiri/${initial.id}`, { method: "DELETE" });
    router.push("/admin/stiri");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <FieldGroup>
        <div>
          <Label required>Titlu</Label>
          <Input value={titlu} onChange={(e) => setTitlu(e.target.value)} />
        </div>
        <div>
          <Label>Rezumat</Label>
          <Textarea value={rezumat ?? ""} onChange={(e) => setRezumat(e.target.value)} maxLength={280} className="min-h-[70px]" />
          <FieldHint>Apare pe carduri și în listă — max 280 caractere.</FieldHint>
        </div>
        <div>
          <Label required>Conținut</Label>
          <Textarea
            value={continut}
            onChange={(e) => setContinut(e.target.value)}
            className="min-h-[240px]"
            placeholder="Paragrafele se despart printr-o linie goală."
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Imagine">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-ink/5 ring-1 ring-inset ring-line"
          >
            {imagineUrl ? (
              <Image src={imagineUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-soft/40">
                <Newspaper className="h-6 w-6" strokeWidth={1.5} />
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
          <FieldHint>JPG sau PNG, sub 5MB. Format recomandat 16:9.</FieldHint>
        </div>
      </FieldGroup>

      <FieldError>{eroare}</FieldError>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => salveaza("draft")} disabled={seSalveaza}>
          {seSalveaza ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvează ciornă
        </Button>
        <Button variant="seal" onClick={() => salveaza("publicat")} disabled={seSalveaza}>
          {seSalveaza ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publică
        </Button>
        {editare && (
          <Button variant="danger" onClick={sterge} className="ml-auto">
            <Trash2 className="h-4 w-4" /> Șterge
          </Button>
        )}
      </div>
    </div>
  );
}
