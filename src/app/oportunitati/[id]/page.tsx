import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Wallet, Clock, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/Card";
import { OpportunityRespondForm } from "@/components/OpportunityRespondForm";
import { OpportunityOwnerActions } from "@/components/OpportunityOwnerActions";
import { StartConversationButton } from "@/components/StartConversationButton";
import type { Opportunity, OpportunityResponse } from "@/types/database";

interface ResponseRow extends OpportunityResponse {
  companies: { id: string; denumire: string; slug: string | null; owner_id: string } | null;
}

export default async function OportunitateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { t, locale } = await getT();
  const dateLocale = locale === "en" ? "en-US" : "ro-RO";

  const TIP_LABEL: Record<string, string> = {
    proiect: t.opportunities.typeProject,
    achizitie: t.opportunities.typePurchase,
    colaborare: t.opportunities.typeCollaboration,
    cerere_servicii: t.opportunities.typeServiceRequest,
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("opportunities")
    .select("*, companies(id, denumire, slug, owner_id), judete(nume), categories(name_ro)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const oport = data as unknown as Opportunity & {
    companies: { id: string; denumire: string; slug: string | null; owner_id: string } | null;
    judete: { nume: string } | null;
    categories: { name_ro: string } | null;
  };

  const esteProprietar = user?.id === oport.companies?.owner_id;

  let areFirma = false;
  let myCompanyId: string | null = null;
  if (user) {
    const { data: myCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();
    if (myCompany) {
      areFirma = true;
      myCompanyId = (myCompany as { id: string }).id;
    }
  }

  const { data: raspunsuriData } = await supabase
    .from("opportunity_responses")
    .select("*, companies(id, denumire, slug, owner_id)")
    .eq("opportunity_id", id)
    .order("created_at", { ascending: true });

  const raspunsuri = (raspunsuriData as unknown as ResponseRow[]) ?? [];
  const aRaspunsDeja = myCompanyId ? raspunsuri.some((r) => r.company_id === myCompanyId) : false;
  const paragrafe = oport.descriere.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/oportunitati" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> {t.opportunities.allOpportunities}
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        <Badge tone="seal">{TIP_LABEL[oport.tip] ?? oport.tip}</Badge>
        {oport.status === "inchisa" && <Badge tone="danger">{t.opportunities.closed}</Badge>}
        {oport.categories?.name_ro && <Badge tone="neutral">{oport.categories.name_ro}</Badge>}
      </div>

      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{oport.titlu}</h1>

      {oport.imagine_url && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-ink/5">
          <Image src={oport.imagine_url} alt="" fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {oport.companies && (
          <Link
            href={oport.companies.slug ? `/firma/${oport.companies.slug}` : `/firma/${oport.companies.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal"
          >
            <Building2 className="h-4 w-4" /> {oport.companies.denumire}
          </Link>
        )}
        {!esteProprietar && oport.companies?.owner_id && (
          <StartConversationButton
            profileId={oport.companies.owner_id}
            numeDestinatar={oport.companies.denumire}
            autentificat={Boolean(user)}
            size="sm"
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {(oport.buget_min || oport.buget_max) && (
          <Badge tone="warning">
            <Wallet className="h-3 w-3" />
            {oport.buget_min && oport.buget_max
              ? `${oport.buget_min.toLocaleString(dateLocale)} – ${oport.buget_max.toLocaleString(dateLocale)} €`
              : `${(oport.buget_min ?? oport.buget_max ?? 0).toLocaleString(dateLocale)} €`}
          </Badge>
        )}
        {oport.judete?.nume && (
          <Badge tone="neutral">
            <MapPin className="h-3 w-3" /> {oport.judete.nume}
          </Badge>
        )}
        {oport.termen_limita && (
          <Badge tone="neutral">
            <Clock className="h-3 w-3" /> {t.opportunities.until} {new Date(oport.termen_limita).toLocaleDateString(dateLocale)}
          </Badge>
        )}
      </div>

      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-ink">
        {paragrafe.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {esteProprietar && (
        <div className="mt-8 flex items-center gap-3 border-t border-line pt-6">
          <OpportunityOwnerActions opportunityId={oport.id} status={oport.status} />
        </div>
      )}

      {esteProprietar ? (
        <section className="mt-10 border-t border-line pt-8">
          <p className="stamp-label mb-4 flex items-center gap-1.5 text-ink-soft">
            <MessageSquare className="h-3.5 w-3.5" /> {t.opportunities.responsesLabel} ({raspunsuri.length})
          </p>
          {raspunsuri.length === 0 ? (
            <p className="text-sm text-ink-soft">{t.opportunities.noResponses}</p>
          ) : (
            <div className="space-y-3">
              {raspunsuri.map((r) => (
                <div key={r.id} className="block-base p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={r.companies?.slug ? `/firma/${r.companies.slug}` : `/firma/${r.companies?.id}`}
                      className="font-semibold text-ink hover:text-seal"
                    >
                      {r.companies?.denumire ?? t.opportunities.companyFallback}
                    </Link>
                    {r.pret_estimat && (
                      <Badge tone="warning">
                        <Wallet className="h-3 w-3" /> {r.pret_estimat.toLocaleString(dateLocale)} €
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.mesaj}</p>
                  {r.companies?.owner_id && (
                    <div className="mt-3">
                      <StartConversationButton
                        profileId={r.companies.owner_id}
                        numeDestinatar={r.companies.denumire}
                        autentificat={Boolean(user)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-10 border-t border-line pt-8">
          <OpportunityRespondForm
            opportunityId={oport.id}
            autentificat={Boolean(user)}
            areFirma={areFirma}
            aRaspunsDeja={aRaspunsDeja}
          />
        </section>
      )}
    </div>
  );
}
