import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/Button";
import { OpportunityForm } from "@/components/OpportunityForm";
import type { Judet } from "@/types/database";

export const metadata = { title: "Postează o oportunitate — ACDR" };

export default async function OportunitateNouaPage() {
  const supabase = await createClient();
  const { t } = await getT();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: companiiData }, { data: judeteData }, { data: categoriiData }] = await Promise.all([
    supabase.from("companies").select("id, denumire").eq("owner_id", user.id).eq("status", "approved"),
    supabase.from("judete").select("cod, nume").order("nume"),
    supabase.from("categories").select("id, name_ro").is("parent_id", null).order("ordine"),
  ]);

  const companii = (companiiData as { id: string; denumire: string }[]) ?? [];
  const judete = (judeteData as Judet[]) ?? [];
  const categorii = ((categoriiData as { id: string; name_ro: string }[]) ?? []).map((c) => ({ id: c.id, label: c.name_ro }));

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/oportunitati" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> {t.opportunities.allOpportunities}
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">{t.opportunities.postNew}</h1>

      {companii.length === 0 ? (
        <div className="block-inset mt-6 p-6 text-center">
          <Building2 className="mx-auto h-6 w-6 text-ink-soft/40" strokeWidth={1.6} />
          <p className="mt-2 text-sm text-ink-soft">{t.opportunities.needCompany}</p>
          <LinkButton href="/inregistrare/firma" variant="seal" size="sm" className="mt-3">
            {t.opportunities.registerLink}
          </LinkButton>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-soft">{t.opportunities.postSubtitle}</p>
          <div className="mt-6">
            <OpportunityForm companii={companii} judete={judete} categorii={categorii} />
          </div>
        </>
      )}
    </div>
  );
}
