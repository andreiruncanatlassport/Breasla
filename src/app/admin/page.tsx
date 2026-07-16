import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";
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
        <h1 className="text-2xl font-semibold text-ink">Administrare</h1>
        <div className="flex gap-2">
          <LinkButton href="/admin/recenzii" variant="secondary" size="sm">Recenzii</LinkButton>
          <LinkButton href="/admin/categorii" variant="secondary" size="sm">Categorii & CAEN</LinkButton>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:w-80">
        <Card>
          <p className="text-2xl font-semibold text-ink">{approvedCount ?? 0}</p>
          <p className="text-xs text-ink/50">firme verificate</p>
        </Card>
        <Card>
          <p className="text-2xl font-semibold text-seal">{pendingCount ?? 0}</p>
          <p className="text-xs text-ink/50">în așteptare</p>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Firme în verificare manuală
        </h2>
        <p className="mt-1 text-xs text-ink/45">
          Aceste firme nu au fost aprobate automat (CUI inactiv/radiat la ANAF sau alt semnal de verificat manual).
        </p>

        <div className="mt-4 space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-ink/50">Nimic în așteptare — bravo!</p>
          )}
          {pending.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/firma/${c.id}`} className="font-medium text-ink hover:text-seal">
                    {c.denumire}
                  </Link>
                  <p className="mt-1 font-mono-num text-xs text-ink/50">CUI {c.cui}</p>
                  <p className="mt-1 text-xs text-ink/50">Stare ANAF: {c.stare_inregistrare || "—"}</p>
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
