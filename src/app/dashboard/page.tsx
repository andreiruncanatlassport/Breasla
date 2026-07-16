import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil, ExternalLink, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ConnectionActions } from "@/components/ConnectionActions";
import type { Company, CompanyStatus } from "@/types/database";

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

interface ConnectionRow {
  id: string;
  status: string;
  requester_company_id: string;
  target_company_id: string;
  created_at: string;
  requester: { id: string; denumire: string } | null;
  target: { id: string; denumire: string } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: companiesData } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const companies = (companiesData as Company[]) ?? [];
  const companyIds = companies.map((c) => c.id);

  let conexiuni: ConnectionRow[] = [];
  if (companyIds.length > 0) {
    const orFilter = companyIds
      .map((id) => `requester_company_id.eq.${id},target_company_id.eq.${id}`)
      .join(",");
    const { data } = await supabase
      .from("connections")
      .select(
        "id, status, requester_company_id, target_company_id, created_at, requester:requester_company_id(id, denumire), target:target_company_id(id, denumire)"
      )
      .or(orFilter)
      .order("created_at", { ascending: false });
    conexiuni = (data as unknown as ConnectionRow[]) ?? [];
  }

  const { data: favoriteData } = await supabase
    .from("company_favorites")
    .select("companies(id, denumire)")
    .eq("profile_id", user.id);
  const favorite =
    (favoriteData as unknown as { companies: { id: string; denumire: string } | null }[] | null)
      ?.map((f) => f.companies)
      .filter((c): c is { id: string; denumire: string } => Boolean(c)) ?? [];

  const primite = conexiuni.filter((c) => c.status === "pending" && companyIds.includes(c.target_company_id));
  const trimise = conexiuni.filter((c) => c.status === "pending" && companyIds.includes(c.requester_company_id));
  const acceptate = conexiuni.filter((c) => c.status === "accepted");

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Contul meu</h1>
        <LinkButton href="/inregistrare" variant="secondary" size="sm">Adaugă altă firmă</LinkButton>
      </div>

      {/* Firmele mele */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Firmele mele</h2>
        <div className="mt-3 space-y-3">
          {companies.length === 0 && (
            <p className="text-sm text-ink/50">Nu ai nicio firmă înregistrată încă.</p>
          )}
          {companies.map((c) => (
            <Card key={c.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{c.denumire}</p>
                <p className="mt-1 font-mono-num text-xs text-ink/50">CUI {c.cui}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                <Link href={`/firma/${c.id}`} className="text-ink/50 hover:text-ink" title="Vezi profilul public">
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link href={`/dashboard/firma/${c.id}/edit`} className="text-ink/50 hover:text-ink" title="Editează">
                  <Pencil className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Cereri primite */}
      {primite.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Cereri de conexiune primite</h2>
          <div className="mt-3 space-y-3">
            {primite.map((c) => (
              <Card key={c.id} className="flex items-center justify-between">
                <Link href={`/firma/${c.requester?.id}`} className="font-medium text-ink hover:text-seal">
                  {c.requester?.denumire}
                </Link>
                <ConnectionActions connectionId={c.id} actiuni={["accept", "decline"]} />
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Cereri trimise */}
      {trimise.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Cereri trimise, în așteptare</h2>
          <div className="mt-3 space-y-3">
            {trimise.map((c) => (
              <Card key={c.id} className="flex items-center justify-between">
                <Link href={`/firma/${c.target?.id}`} className="font-medium text-ink hover:text-seal">
                  {c.target?.denumire}
                </Link>
                <ConnectionActions connectionId={c.id} actiuni={["cancel"]} />
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Conexiuni active */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Conexiunile mele</h2>
        <div className="mt-3 space-y-3">
          {acceptate.length === 0 && (
            <p className="text-sm text-ink/50">Nicio conexiune activă încă.</p>
          )}
          {acceptate.map((c) => {
            const cealalta = companyIds.includes(c.requester_company_id) ? c.target : c.requester;
            return (
              <Card key={c.id}>
                <Link href={`/firma/${cealalta?.id}`} className="font-medium text-ink hover:text-seal">
                  {cealalta?.denumire}
                </Link>
              </Card>
            );
          })}
        </div>
      </section>
      {/* Favorite */}
      <section className="mt-8">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-ink/50">
          <Bookmark className="h-3.5 w-3.5" /> Firme salvate
        </h2>
        <div className="mt-3 space-y-3">
          {favorite.length === 0 && (
            <p className="text-sm text-ink/50">Nicio firmă salvată încă.</p>
          )}
          {favorite.map((f) => (
            <Card key={f.id}>
              <Link href={`/firma/${f.id}`} className="font-medium text-ink hover:text-seal">
                {f.denumire}
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
