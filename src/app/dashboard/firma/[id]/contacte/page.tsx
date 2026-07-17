"use client";

import { useEffect, useState, use } from "react";
import { Trash2, Plus, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { ReauthGate } from "@/components/ReauthGate";
import type { CompanyContact } from "@/types/database";

const CONTACT_GOL = { nume: "", rol: "", departament: "", telefon: "", email: "" };

export default function ContactePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contacte, setContacte] = useState<CompanyContact[]>([]);
  const [formular, setFormular] = useState(CONTACT_GOL);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);

  async function incarca() {
    const supabase = createClient();
    const { data } = await supabase
      .from("company_contacts")
      .select("*")
      .eq("company_id", id)
      .order("ordine");
    setContacte((data as CompanyContact[]) ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    incarca();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function adauga() {
    if (!formular.nume.trim()) {
      setEroare("Numele e obligatoriu.");
      return;
    }
    setSeSalveaza(true);
    setEroare(null);
    const supabase = createClient();
    const { error } = await supabase.from("company_contacts").insert({
      company_id: id,
      ...formular,
      ordine: contacte.length,
    } as never);
    setSeSalveaza(false);
    if (error) {
      setEroare(error.message);
      return;
    }
    setFormular(CONTACT_GOL);
    incarca();
  }

  async function sterge(contactId: string) {
    const supabase = createClient();
    await supabase.from("company_contacts").delete().eq("id", contactId);
    incarca();
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-xl font-semibold text-ink">Persoane de contact</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Adaugă persoanele potrivite pe departamente (vânzări, suport, contabilitate...) — sunt
        vizibile pe profilul public al firmei.
      </p>

      <ReauthGate>
        <div className="mt-6 space-y-3">
          {contacte.map((c) => (
            <Card key={c.id} className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/8">
                  <UserRound className="h-4 w-4 text-ink-soft" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-ink">{c.nume}</p>
                  <p className="text-ink-soft">
                    {[c.rol, c.departament].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-0.5 text-ink-soft">{[c.telefon, c.email].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <button onClick={() => sterge(c.id)} className="text-ink-soft/70 hover:text-rust">
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
          {contacte.length === 0 && (
            <p className="text-sm text-ink-soft">Niciun contact adăugat încă.</p>
          )}
        </div>

        <Card className="mt-6">
          <p className="font-medium text-ink">Adaugă o persoană de contact</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label required>Nume</Label>
              <Input value={formular.nume} onChange={(e) => setFormular({ ...formular, nume: e.target.value })} />
            </div>
            <div>
              <Label>Rol</Label>
              <Input value={formular.rol} onChange={(e) => setFormular({ ...formular, rol: e.target.value })} placeholder="ex: Manager Vânzări" />
            </div>
            <div>
              <Label>Departament</Label>
              <Input value={formular.departament} onChange={(e) => setFormular({ ...formular, departament: e.target.value })} placeholder="ex: Vânzări" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={formular.telefon} onChange={(e) => setFormular({ ...formular, telefon: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={formular.email} onChange={(e) => setFormular({ ...formular, email: e.target.value })} />
            </div>
          </div>
          <FieldError>{eroare}</FieldError>
          <Button size="sm" className="mt-3" onClick={adauga} disabled={seSalveaza}>
            <Plus className="h-3.5 w-3.5" /> Adaugă
          </Button>
        </Card>

        <div className="mt-6">
          <LinkButton href={`/dashboard/firma/${id}/edit`} variant="ghost" size="sm">
            ← Înapoi la profil
          </LinkButton>
        </div>
      </ReauthGate>
    </div>
  );
}
