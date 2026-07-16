"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Trash2, ImageOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, FieldError } from "@/components/ui/Field";
import { ReauthGate } from "@/components/ReauthGate";
import type { CompanyProject } from "@/types/database";

export default function PortofoliuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [proiecte, setProiecte] = useState<CompanyProject[]>([]);
  const [titluNou, setTitluNou] = useState("");
  const [seCreeaza, setSeCreeaza] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function incarca() {
    const supabase = createClient();
    const { data } = await supabase
      .from("company_projects")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: false });
    setProiecte((data as CompanyProject[]) ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    incarca();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function creeaza() {
    if (!titluNou.trim()) {
      setEroare("Titlul e obligatoriu.");
      return;
    }
    setSeCreeaza(true);
    setEroare(null);
    const supabase = createClient();
    const { error } = await supabase.from("company_projects").insert({
      company_id: id,
      titlu: titluNou.trim(),
    } as never);
    setSeCreeaza(false);
    if (error) {
      setEroare(error.message);
      return;
    }
    setTitluNou("");
    incarca();
  }

  async function sterge(proiectId: string) {
    if (!window.confirm("Ștergi acest proiect din portofoliu?")) return;
    const supabase = createClient();
    await supabase.from("company_projects").delete().eq("id", proiectId);
    incarca();
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-xl font-semibold text-ink">Portofoliu / Lucrări</h1>
      <p className="mt-1 text-sm text-ink/60">
        Fiecare lucrare are propria pagină publică, cu poze și detalii.
      </p>

      <ReauthGate>
        <Card className="mt-6">
          <p className="font-medium text-ink">Adaugă o lucrare nouă</p>
          <div className="mt-3 flex gap-2">
            <Input
              value={titluNou}
              onChange={(e) => setTitluNou(e.target.value)}
              placeholder="ex: Renovare birouri corporate, Cluj"
            />
            <Button size="sm" onClick={creeaza} disabled={seCreeaza}>
              <Plus className="h-3.5 w-3.5" /> Creează
            </Button>
          </div>
          <FieldError>{eroare}</FieldError>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {proiecte.map((p) => (
            <Card key={p.id} className="p-0 overflow-hidden">
              <div className="relative h-32 w-full bg-ink/5">
                {p.cover_url ? (
                  <Image src={p.cover_url} alt={p.titlu} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink/25">
                    <ImageOff className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-ink">{p.titlu}</p>
                {p.locatie && <p className="text-xs text-ink/50">{p.locatie}{p.an ? ` · ${p.an}` : ""}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <Link
                    href={`/dashboard/firma/${id}/portofoliu/${p.id}`}
                    className="text-xs font-medium text-seal hover:underline"
                  >
                    Editează poze & detalii
                  </Link>
                  <button onClick={() => sterge(p.id)} className="text-ink/40 hover:text-rust">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {proiecte.length === 0 && (
          <p className="mt-6 text-sm text-ink/50">Niciun proiect adăugat încă.</p>
        )}

        <div className="mt-6">
          <LinkButton href={`/dashboard/firma/${id}/edit`} variant="ghost" size="sm">
            ← Înapoi la profil
          </LinkButton>
        </div>
      </ReauthGate>
    </div>
  );
}
