import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase } from "lucide-react";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Card, Badge, SectionLabel } from "@/components/ui/Card";
import { AdminOpportunityActions } from "@/components/AdminOpportunityActions";
import type { Profile, Opportunity } from "@/types/database";

interface OportunitateRand extends Opportunity {
  companies: { denumire: string; slug: string | null } | null;
}

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warning"> = {
  in_asteptare: "warning",
  deschisa: "success",
  respinsa: "danger",
  inchisa: "neutral",
};
const STATUS_LABEL: Record<string, string> = {
  in_asteptare: "În așteptare",
  deschisa: "Deschisă",
  respinsa: "Respinsă",
  inchisa: "Închisă",
};

export default async function AdminOportunitatiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("opportunities")
    .select("*, companies(denumire, slug)")
    .order("created_at", { ascending: false })
    .limit(200);

  const ORDINE_STATUS: Record<string, number> = { in_asteptare: 0, deschisa: 1, respinsa: 2, inchisa: 3 };
  const oportunitati = ((data as OportunitateRand[]) ?? []).sort(
    (a, b) => ORDINE_STATUS[a.status] - ORDINE_STATUS[b.status]
  );
  const nrInAsteptare = oportunitati.filter((o) => o.status === "in_asteptare").length;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> Administrare
      </Link>

      <div className="mt-6">
        <p className="stamp-label text-seal">Moderare</p>
        <h1 className="mt-1.5 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink">
          <Briefcase className="h-6 w-6 text-seal" /> Oportunități
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Oportunitățile noi trec întâi prin verificare aici — nu apar public până nu le aprobi, ca să nu devină
          reclame nesolicitate.
        </p>
      </div>

      <section className="mt-8">
        <SectionLabel icon={<Briefcase className="h-3.5 w-3.5" />}>
          Toate ({oportunitati.length}){nrInAsteptare > 0 ? ` — ${nrInAsteptare} în așteptare` : ""}
        </SectionLabel>

        <div className="mt-4 space-y-3">
          {oportunitati.length === 0 && <p className="text-sm text-ink-soft">Nicio oportunitate încă.</p>}
          {oportunitati.map((o) => (
            <Card key={o.id} className="lift-on-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-ink">{o.titlu}</p>
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {o.companies?.denumire ?? "Firmă ștearsă"} ·{" "}
                    {new Date(o.created_at).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{o.descriere}</p>
                </div>
                <AdminOpportunityActions opportunityId={o.id} status={o.status} />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
