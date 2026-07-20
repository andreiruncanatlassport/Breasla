"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Send, CalendarDays, Trash2 } from "lucide-react";
import { incarcaImagineSite } from "@/lib/upload";
import { Input, Label, Select, Textarea, FieldError, FieldHint, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { EventItem } from "@/types/database";

const TIP_OPTIUNI = [
  { id: "conferinta", label: "Conferință" },
  { id: "workshop", label: "Workshop" },
  { id: "networking", label: "Networking" },
  { id: "altul", label: "Altul" },
] as const;

function laInputDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function EventForm({ initial }: { initial?: EventItem }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const editare = Boolean(initial);

  const [titlu, setTitlu] = useState(initial?.titlu ?? "");
  const [descriere, setDescriere] = useState(initial?.descriere ?? "");
  const [tip, setTip] = useState<string>(initial?.tip ?? "networking");
  const [locatie, setLocatie] = useState(initial?.locatie ?? "");
  const [online, setOnline] = useState(initial?.online ?? false);
  const [linkExtern, setLinkExtern] = useState(initial?.link_extern ?? "");
  const [dataInceput, setDataInceput] = useState(laInputDatetime(initial?.data_inceput));
  const [dataSfarsit, setDataSfarsit] = useState(laInputDatetime(initial?.data_sfarsit));
  const [capacitate, setCapacitate] = useState(initial?.capacitate?.toString() ?? "");
  const [imagineUrl, setImagineUrl] = useState(initial?.imagine_url ?? null);
  const [seIncarcaImagine, setSeIncarcaImagine] = useState(false);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function incarcaImagine(fisier: File) {
    setSeIncarcaImagine(true);
    setEroare(null);
    try {
      const { publicUrl } = await incarcaImagineSite("evenimente", initial?.id ?? "temp", fisier);
      setImagineUrl(publicUrl);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setSeIncarcaImagine(false);
    }
  }

  async function salveaza(status: "draft" | "publicat") {
    if (!titlu.trim() || !descriere.trim() || !dataInceput) {
      setEroare("Titlul, descrierea și data de început sunt obligatorii.");
      return;
    }
    setSeSalveaza(true);
    setEroare(null);
    try {
      const body = {
        titlu,
        descriere,
        tip,
        locatie: online ? null : locatie,
        online,
        link_extern: linkExtern || null,
        data_inceput: new Date(dataInceput).toISOString(),
        data_sfarsit: dataSfarsit ? new Date(dataSfarsit).toISOString() : null,
        capacitate: capacitate ? Number(capacitate) : null,
        imagine_url: imagineUrl,
        status,
      };
      const res = await fetch(editare ? `/api/admin/evenimente/${initial!.id}` : "/api/admin/evenimente", {
        method: editare ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setEroare(json?.error ?? "Nu am putut salva evenimentul.");
        return;
      }
      router.push("/admin/evenimente");
      router.refresh();
    } finally {
      setSeSalveaza(false);
    }
  }

  async function sterge() {
    if (!initial || !confirm("Ștergi definitiv acest eveniment?")) return;
    await fetch(`/api/admin/evenimente/${initial.id}`, { method: "DELETE" });
    router.push("/admin/evenimente");
    router.refresh();
  }

  async function anuleaza() {
    if (!initial) return;
    await fetch(`/api/admin/evenimente/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "anulat" }),
    });
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
          <Label required>Descriere</Label>
          <Textarea
            value={descriere}
            onChange={(e) => setDescriere(e.target.value)}
            className="min-h-[180px]"
            placeholder="Paragrafele se despart printr-o linie goală."
          />
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

      <FieldGroup title="Loc și dată">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Începe la</Label>
            <Input type="datetime-local" value={dataInceput} onChange={(e) => setDataInceput(e.target.value)} />
          </div>
          <div>
            <Label>Se termină la</Label>
            <Input type="datetime-local" value={dataSfarsit} onChange={(e) => setDataSfarsit(e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="h-4 w-4 accent-[var(--color-seal)]" />
          Eveniment online
        </label>

        {!online && (
          <div>
            <Label>Locație</Label>
            <Input value={locatie ?? ""} onChange={(e) => setLocatie(e.target.value)} placeholder="Ex: Cluj-Napoca, Hotel X" />
          </div>
        )}

        <div>
          <Label>Link extern (înscriere/detalii)</Label>
          <Input value={linkExtern ?? ""} onChange={(e) => setLinkExtern(e.target.value)} placeholder="https://..." />
        </div>

        <div className="max-w-[200px]">
          <Label>Capacitate (opțional)</Label>
          <Input type="number" min={1} value={capacitate} onChange={(e) => setCapacitate(e.target.value)} />
          <FieldHint>Lasă gol pentru locuri nelimitate.</FieldHint>
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
                <CalendarDays className="h-6 w-6" strokeWidth={1.5} />
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
          Salvează ciornă
        </Button>
        <Button variant="seal" onClick={() => salveaza("publicat")} disabled={seSalveaza}>
          {seSalveaza ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publică
        </Button>
        {editare && initial?.status !== "anulat" && (
          <Button variant="secondary" onClick={anuleaza}>
            Anulează evenimentul
          </Button>
        )}
        {editare && (
          <Button variant="danger" onClick={sterge} className="ml-auto">
            <Trash2 className="h-4 w-4" /> Șterge
          </Button>
        )}
      </div>
    </div>
  );
}
