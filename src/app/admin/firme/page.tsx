import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, SectionLabel } from "@/components/ui/Card";
import { AdminCompanyActions } from "@/components/AdminCompanyActions";
import { AdminCompanyCreateForm } from "@/components/AdminCompanyCreateForm";
import type { Company, CompanyStatus, Judet, Profile } from "@/types/database";

const STATUS_LABEL: Record<CompanyStatus, string> = {
  pending: "În verificare",
  approved: "Verificată",
  rejected: "Respinsă",
  suspended: "Suspendată",
};
const STATUS_TONE: Record<CompanyStatus, "neutral" | "success" | "danger" | "warning"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "danger",
};

export default async function AdminFirmePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const { data: judeteData } = await supabase.from("judete").select("cod, nume").order("nume");
  const judete = (judeteData as Judet[]) ?? [];

  let query = supabase
    .from("companies")
    .select("id, denumire, cui, status, judet_cod, localitate, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.ilike("denumire", `%${q}%`);

  const { data } = await query;
  const firme = (data as Pick<Company, "id" | "denumire" | "cui" | "status" | "judet_cod" | "localitate" | "created_at">[]) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> Administrare
      </Link>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="stamp-label text-seal">Gestionare firme</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Firme</h1>
        </div>
      </div>

      {/* Adaugare manuala */}
      <section className="mt-8">
        <SectionLabel icon={<Building2 className="h-3.5 w-3.5" />}>Adaugă o firmă manual</SectionLabel>
        <p className="mt-1 text-xs text-ink-soft/70">
          Completezi tu toate datele (nu trece prin ANAF). Firma e publicată direct în catalog.
        </p>
        <div className="mt-4">
          <AdminCompanyCreateForm judete={judete} />
        </div>
      </section>

      {/* Lista firmelor */}
      <section className="mt-10">
        <SectionLabel icon={<Building2 className="h-3.5 w-3.5" />}>Toate firmele ({firme.length})</SectionLabel>

        <form className="mt-3 max-w-sm">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Caută după denumire..."
            className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-200 placeholder:text-ink-soft/60 focus:border-seal focus:ring-3 focus:ring-seal/12"
          />
        </form>

        <div className="mt-4 space-y-3">
          {firme.length === 0 && <p className="text-sm text-ink-soft">Nicio firmă găsită.</p>}
          {firme.map((c) => (
            <Card key={c.id} className="lift-on-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/firma/${c.id}`} className="font-medium text-ink hover:text-seal">
                      {c.denumire}
                    </Link>
                    <Badge tone={STATUS_TONE[c.status as CompanyStatus]}>{STATUS_LABEL[c.status as CompanyStatus]}</Badge>
                  </div>
                  <p className="mt-1 font-mono-num text-xs text-ink-soft">CUI {c.cui}</p>
                  {c.localitate && <p className="mt-0.5 text-xs text-ink-soft">{c.localitate}</p>}
                </div>
                <AdminCompanyActions
                  companyId={c.id}
                  actiuniDisponibile={c.status === "approved" ? ["suspend"] : ["approve"]}
                  potSterge
                />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
