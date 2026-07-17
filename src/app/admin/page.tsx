import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, SectionLabel, StatBlock } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { AdminCompanyActions } from "@/components/AdminCompanyActions";
import type { Company, Profile } from "@/types/database";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const [{ data: pendingData }, { count: approvedCount }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("companies")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const pending = (pendingData as Company[]) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="stamp-label text-seal">Panou de control</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Administrare</h1>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/admin/recenzii" variant="secondary" size="sm">Recenzii</LinkButton>
          <LinkButton href="/admin/categorii" variant="secondary" size="sm">Categorii & CAEN</LinkButton>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:max-w-md">
        <StatBlock label="Verificate" value={approvedCount ?? 0} hint="firme publice în catalog" />
        <StatBlock label="În așteptare" value={pendingCount ?? 0} hint="necesită verificare" accent />
      </div>

      <section className="mt-8">
        <SectionLabel icon={<ShieldQuestion className="h-3.5 w-3.5" />}>Firme în verificare manuală</SectionLabel>
        <p className="mt-1 text-xs text-ink-soft/70">
          Aceste firme nu au fost aprobate automat (CUI inactiv/radiat la ANAF sau alt semnal de verificat manual).
        </p>

        <div className="mt-4 space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-ink-soft">Nimic în așteptare — bravo!</p>
          )}
          {pending.map((c) => (
            <Card key={c.id} className="lift-on-hover">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/firma/${c.id}`} className="font-medium text-ink hover:text-seal">
                    {c.denumire}
                  </Link>
                  <p className="mt-1 font-mono-num text-xs text-ink-soft">CUI {c.cui}</p>
                  <p className="mt-1 text-xs text-ink-soft">Stare ANAF: {c.stare_inregistrare || "—"}</p>
                  {c.radiata && <Badge tone="danger">Radiată la ANAF</Badge>}
                </div>
                <AdminCompanyActions companyId={c.id} actiuniDisponibile={["approve", "reject"]} />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
