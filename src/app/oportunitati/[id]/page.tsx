import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Wallet, CalendarClock, Building2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { OpportunityRespondForm } from "@/components/OpportunityRespondForm";
import { OpportunityCloseButton } from "@/components/OpportunityCloseButton";
import type { Opportunity } from "@/types/database";

interface OpportunityDetailRow extends Opportunity {
  judete: { nume: string } | null;
  companies: { id: string; denumire: string; slug: string | null; logo_url: string | null; owner_id: string } | null;
}

interface RaspunsRow {
  id: string;
  mesaj: string;
  pret_estimat: number | null;
  created_at: string;
  company_id: string;
  companies: { denumire: string; slug: string | null; logo_url: string | null } | null;
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
    .select("*, judete(nume), companies(id, denumire, slug, logo_url, owner_id)")
    .eq("id", id)
    .maybeSingle();

  const oportunitate = data as unknown as OpportunityDetailRow | null;
  if (!oportunitate) notFound();

  const suntProprietar = Boolean(user && oportunitate.companies?.owner_id === user.id);

  // firmele mele aprobate — pentru a sti daca pot raspunde si daca am raspuns deja
  let companiileMeleIds: string[] = [];
  if (user) {
    const { data: companiiData } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "approved");
    companiileMeleIds = ((companiiData as { id: string }[]) ?? []).map((c) => c.id);
  }

  let amRaspunsDeja = false;
  if (companiileMeleIds.length > 0) {
    const { data: raspunsExistent } = await supabase
      .from("opportunity_responses")
      .select("id")
      .eq("opportunity_id", id)
      .in("company_id", companiileMeleIds)
      .maybeSingle();
    amRaspunsDeja = Boolean(raspunsExistent);
  }

  let raspunsuri: RaspunsRow[] = [];
  if (suntProprietar) {
    const { data: raspunsuriData } = await supabase
      .from("opportunity_responses")
      .select("id, mesaj, pret_estimat, created_at, company_id, companies(denumire, slug, logo_url)")
      .eq("opportunity_id", id)
      .order("created_at", { ascending: false });
    raspunsuri = (raspunsuriData as unknown as RaspunsRow[]) ?? [];
  }

  const bugetText =
    oportunitate.buget_min && oportunitate.buget_max
      ? `${oportunitate.buget_min.toLocaleString("ro-RO")}–${oportunitate.buget_max.toLocaleString("ro-RO")} €`
      : oportunitate.buget_min
        ? `de la ${oportunitate.buget_min.toLocaleString("ro-RO")} €`
        : oportunitate.buget_max
          ? `până la ${oportunitate.buget_max.toLocaleString("ro-RO")} €`
          : null;

  const paragrafe = oportunitate.descriere.split(/\n{2,}/).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/oportunitati" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> {t.opportunities.allOpportunities}
      </Link>

      {oportunitate.imagine_url && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-navy">
          <Image src={oportunitate.imagine_url} alt="" fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        <Badge tone="seal">{TIP_LABEL[oportunitate.tip] ?? oportunitate.tip}</Badge>
        {oportunitate.status === "inchisa" && <Badge tone="danger">{t.opportunities.closed}</Badge>}
      </div>

      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{oportunitate.titlu}</h1>

      <Link
        href={oportunitate.companies?.slug ? `/firma/${oportunitate.companies.slug}` : `/firma/${oportunitate.companies?.id}`}
        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-seal"
      >
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line">
          {oportunitate.companies?.logo_url ? (
            <Image src={oportunitate.companies.logo_url} alt="" fill className="object-cover" unoptimized />
          ) : (
            <Building2 className="h-3.5 w-3.5 text-ink-soft/40" />
          )}
        </div>
        {oportunitate.companies?.denumire ?? t.opportunities.companyFallback}
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {oportunitate.judete?.nume && (
          <Badge tone="neutral">
            <MapPin className="h-3 w-3" /> {oportunitate.judete.nume}
          </Badge>
        )}
        {bugetText && (
          <Badge tone="success">
            <Wallet className="h-3 w-3" /> {bugetText}
          </Badge>
        )}
        {oportunitate.termen_limita && (
          <Badge tone="warning">
            <CalendarClock className="h-3 w-3" /> {t.opportunities.until}{" "}
            {new Date(oportunitate.termen_limita).toLocaleDateString(dateLocale, { day: "2-digit", month: "long", year: "numeric" })}
          </Badge>
        )}
      </div>

      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-ink">
        {paragrafe.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-10 border-t border-line pt-8">
        {suntProprietar ? (
          <div>
            <OpportunityCloseButton opportunityId={oportunitate.id} status={oportunitate.status} labels={{ close: t.opportunities.close, reopen: t.opportunities.reopen }} />

            <p className="stamp-label mt-8 text-ink-soft">
              {t.opportunities.responsesLabel} ({raspunsuri.length})
            </p>
            {raspunsuri.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">{t.opportunities.noResponses}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {raspunsuri.map((r) => (
                  <div key={r.id} className="block-inset p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={r.companies?.slug ? `/firma/${r.companies.slug}` : `/firma/${r.company_id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-seal"
                      >
                        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line">
                          {r.companies?.logo_url ? (
                            <Image src={r.companies.logo_url} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <Building2 className="h-3.5 w-3.5 text-ink-soft/40" />
                          )}
                        </div>
                        {r.companies?.denumire ?? t.opportunities.companyFallback}
                      </Link>
                      {r.pret_estimat && <Badge tone="success">{r.pret_estimat.toLocaleString("ro-RO")} €</Badge>}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.mesaj}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : oportunitate.status === "inchisa" ? null : !user ? (
          <div className="block-inset p-5 text-center">
            <UserRound className="mx-auto h-6 w-6 text-ink-soft/40" strokeWidth={1.6} />
            <p className="mt-2 text-sm text-ink-soft">{t.opportunities.loginToRespond}</p>
            <div className="mt-3 flex justify-center gap-2">
              <LinkButton href="/login" variant="seal" size="sm">
                {t.opportunities.loginLink}
              </LinkButton>
              <LinkButton href="/inregistrare" variant="secondary" size="sm">
                {t.opportunities.registerLink}
              </LinkButton>
            </div>
          </div>
        ) : companiileMeleIds.length === 0 ? (
          <div className="block-inset p-5 text-center">
            <Building2 className="mx-auto h-6 w-6 text-ink-soft/40" strokeWidth={1.6} />
            <p className="mt-2 text-sm text-ink-soft">{t.opportunities.needCompany}</p>
            <LinkButton href="/inregistrare/firma" variant="seal" size="sm" className="mt-3">
              {t.opportunities.registerLink}
            </LinkButton>
          </div>
        ) : amRaspunsDeja ? (
          <div className="block-inset p-5 text-center">
            <p className="text-sm text-ink-soft">{t.opportunities.alreadyRespondedContact}</p>
          </div>
        ) : (
          <OpportunityRespondForm
            opportunityId={oportunitate.id}
            labels={{
              prompt: t.opportunities.respondPrompt,
              estimatedPrice: t.opportunities.estimatedPrice,
              placeholder: t.opportunities.responsePlaceholder,
              respond: t.opportunities.respond,
              respondError: t.opportunities.respondError,
            }}
          />
        )}
      </div>
    </article>
  );
}
