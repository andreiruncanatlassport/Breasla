"use client";

import { useEffect, useState, useRef, use } from "react";
import Image from "next/image";
import { Camera, Loader2, Trash2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { incarcaImagineFirma } from "@/lib/upload";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Field";
import { ReauthGate } from "@/components/ReauthGate";
import { SkeletonPage } from "@/components/ui/Skeleton";
import type { CompanyProject, ProjectImage } from "@/types/database";

export default function EditeazaProiectPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = use(params);
  const [proiect, setProiect] = useState<CompanyProject | null>(null);
  const [imagini, setImagini] = useState<ProjectImage[]>([]);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [seIncarcaCover, setSeIncarcaCover] = useState(false);
  const [seIncarcaGalerie, setSeIncarcaGalerie] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [salvat, setSalvat] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galerieInputRef = useRef<HTMLInputElement>(null);

  async function incarca() {
    const supabase = createClient();
    const [{ data: p }, { data: img }] = await Promise.all([
      supabase.from("company_projects").select("*").eq("id", projectId).single(),
      supabase.from("project_images").select("*").eq("project_id", projectId).order("ordine"),
    ]);
    setProiect(p as CompanyProject | null);
    setImagini((img as ProjectImage[]) ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    incarca();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!proiect) {
    return <SkeletonPage />;
  }

  function update(patch: Partial<CompanyProject>) {
    setProiect((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function incarcaCover(fisier: File) {
    setSeIncarcaCover(true);
    setEroare(null);
    try {
      const { publicUrl } = await incarcaImagineFirma(id, `proiecte/${projectId}/cover`, fisier);
      update({ cover_url: publicUrl });
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setSeIncarcaCover(false);
    }
  }

  async function incarcaGalerie(fisiere: FileList) {
    setSeIncarcaGalerie(true);
    setEroare(null);
    try {
      const supabase = createClient();
      for (const fisier of Array.from(fisiere)) {
        const { publicUrl } = await incarcaImagineFirma(id, `proiecte/${projectId}/galerie`, fisier);
        if (publicUrl) {
          await supabase.from("project_images").insert({
            project_id: projectId,
            url: publicUrl,
            ordine: imagini.length,
          } as never);
        }
      }
      incarca();
    } catch (e) {
      setEroare(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setSeIncarcaGalerie(false);
    }
  }

  async function stergeImagine(imgId: string) {
    const supabase = createClient();
    await supabase.from("project_images").delete().eq("id", imgId);
    incarca();
  }

  async function salveaza() {
    setSeSalveaza(true);
    setEroare(null);
    setSalvat(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("company_projects")
      .update({
        titlu: proiect!.titlu,
        descriere: proiect!.descriere,
        locatie: proiect!.locatie,
        an: proiect!.an,
        cover_url: proiect!.cover_url,
      } as never)
      .eq("id", projectId);
    setSeSalveaza(false);
    if (error) {
      setEroare(error.message);
      return;
    }
    setSalvat(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-xl font-semibold text-ink">Editează lucrarea</h1>

      <ReauthGate>
        <Card className="mt-6 space-y-4">
          <div>
            <Label required>Titlu</Label>
            <Input value={proiect.titlu} onChange={(e) => update({ titlu: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Locație</Label>
              <Input value={proiect.locatie ?? ""} onChange={(e) => update({ locatie: e.target.value })} />
            </div>
            <div>
              <Label>An</Label>
              <Input
                type="number"
                value={proiect.an ?? ""}
                onChange={(e) => update({ an: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
          </div>
          <div>
            <Label>Descriere</Label>
            <Textarea value={proiect.descriere ?? ""} onChange={(e) => update({ descriere: e.target.value })} />
          </div>

          <div>
            <Label>Imagine copertă</Label>
            <div className="relative mt-1 h-40 w-full overflow-hidden rounded-lg bg-ink/5">
              {proiect.cover_url && (
                <Image src={proiect.cover_url} alt="Copertă" fill className="object-cover" unoptimized />
              )}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-navy/0 text-white opacity-0 transition hover:bg-navy/40 hover:opacity-100"
              >
                {seIncarcaCover ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && incarcaCover(e.target.files[0])}
              />
            </div>
          </div>

          <FieldError>{eroare}</FieldError>
          {salvat && <p className="text-sm font-medium text-teal">Salvat.</p>}
          <Button onClick={salveaza} disabled={seSalveaza}>
            {seSalveaza ? "Se salvează..." : "Salvează detaliile"}
          </Button>
        </Card>

        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">Galerie foto</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => galerieInputRef.current?.click()}
              disabled={seIncarcaGalerie}
            >
              {seIncarcaGalerie ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Adaugă poze
            </Button>
            <input
              ref={galerieInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && incarcaGalerie(e.target.files)}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {imagini.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-ink/5">
                <Image src={img.url} alt="" fill className="object-cover" unoptimized />
                <button
                  onClick={() => stergeImagine(img.id)}
                  className="absolute right-1 top-1 rounded-full bg-navy/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {imagini.length === 0 && <p className="mt-2 text-sm text-ink-soft">Nicio poză adăugată încă.</p>}
        </Card>

        <div className="mt-6">
          <LinkButton href={`/dashboard/firma/${id}/portofoliu`} variant="ghost" size="sm">
            ← Înapoi la portofoliu
          </LinkButton>
        </div>
      </ReauthGate>
    </div>
  );
}
