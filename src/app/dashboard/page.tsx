import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil, ExternalLink, Bookmark, Building2, Inbox, Send, Handshake, FileText, Plus, Archive } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, SectionLabel } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ConnectionActions } from "@/components/ConnectionActions";
import { EmailUnverifiedBanner } from "@/components/EmailUnverifiedBanner";
import { ArchiveButton } from "@/components/ArchiveButton";
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const arataArhivate = params.arhivate === "1";
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

  // Cereri de oferta: trimise de mine + primite de firmele mele
  let cereriTrimise: { id: string; titlu: string; status: string; created_at: string; requester_company_id: string }[] = [];
  let cereriPrimite: {
    rfq_id: string;
    company_id: string;
    rfqs: { id: string; titlu: string; status: string; created_at: string } | null;
  }[] = [];
  if (companyIds.length > 0) {
    const [{ data: trimise }, { data: primite }] = await Promise.all([
      supabase
        .from("rfqs")
        .select("id, titlu, status, created_at, requester_company_id")
        .in("requester_company_id", companyIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("rfq_recipients")
        .select("rfq_id, company_id, rfqs(id, titlu, status, created_at)")
        .in("company_id", companyIds)
        .order("created_at", { ascending: false }),
    ]);
    cereriTrimise = (trimise as typeof cereriTrimise) ?? [];
    cereriPrimite = (primite as unknown as typeof cereriPrimite) ?? [];
  }

  // Înțelegeri active
  let intelegeri: { id: string; titlu: string; status: string; company_a_id: string; company_b_id: string; updated_at: string }[] = [];
  if (companyIds.length > 0) {
    const orFilter = companyIds.map((id) => `company_a_id.eq.${id},company_b_id.eq.${id}`).join(",");
    const { data } = await supabase
      .from("deals")
      .select("id, titlu, status, company_a_id, company_b_id, updated_at")
      .or(orFilter)
      .order("updated_at", { ascending: false });
    intelegeri = (data as typeof intelegeri) ?? [];
  }

  // Ce am arhivat deja, ca sa filtram listele active (sau, invers, sa aratam doar arhivatele)
  let rfqArhivate = new Set<string>();
  let dealArhivate = new Set<string>();
  if (companyIds.length > 0) {
    const [{ data: rfqArh }, { data: dealArh }] = await Promise.all([
      supabase.from("rfq_arhivari").select("rfq_id").in("company_id", companyIds),
      supabase.from("deal_arhivari").select("deal_id").in("company_id", companyIds),
    ]);
    rfqArhivate = new Set(((rfqArh as { rfq_id: string }[]) ?? []).map((r) => r.rfq_id));
    dealArhivate = new Set(((dealArh as { deal_id: string }[]) ?? []).map((r) => r.deal_id));
  }

  cereriTrimise = cereriTrimise.filter((c) => rfqArhivate.has(c.id) === arataArhivate);
  cereriPrimite = cereriPrimite.filter((c) => c.rfqs && rfqArhivate.has(c.rfqs.id) === arataArhivate);
  intelegeri = intelegeri.filter((d) => dealArhivate.has(d.id) === arataArhivate);

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

  const { data: profileData } = await supabase
    .from("profiles")
    .select("email_verificat")
    .eq("id", user.id)
    .maybeSingle();
  const emailVerificat = (profileData as { email_verificat: boolean } | null)?.email_verificat ?? true;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      {!emailVerificat && user.email && <EmailUnverifiedBanner email={user.email} />}

      <div className="flex items-center justify-between">
        <div>
          <p className="stamp-label text-seal">Panoul tău</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Contul meu</h1>
        </div>
        <LinkButton href="/inregistrare" variant="secondary" size="sm">Adaugă altă firmă</LinkButton>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton href="/dashboard/profil" variant="secondary" size="sm">Profilul meu public</LinkButton>
        <LinkButton href="/mesaje" variant="secondary" size="sm">Mesajele mele</LinkButton>
        <LinkButton href="/oportunitati/noua" variant="secondary" size="sm">Postează o oportunitate</LinkButton>
      </div>

      {/* Firmele mele */}
      <section className="mt-8">
        <SectionLabel icon={<Building2 className="h-3.5 w-3.5" />}>Firmele mele</SectionLabel>
        <div className="mt-3 space-y-3">
          {companies.length === 0 && (
            <p className="text-sm text-ink-soft">Nu ai nicio firmă înregistrată încă.</p>
          )}
          {companies.map((c) => (
            <Card key={c.id} className="lift-on-hover flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{c.denumire}</p>
                <p className="mt-1 font-mono-num text-xs text-ink-soft">CUI {c.cui}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                <Link href={`/firma/${c.id}`} className="text-ink-soft hover:text-ink" title="Vezi profilul public">
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link href={`/dashboard/firma/${c.id}/edit`} className="text-ink-soft hover:text-ink" title="Editează">
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
          <SectionLabel icon={<Inbox className="h-3.5 w-3.5" />}>Cereri primite</SectionLabel>
          <div className="mt-3 space-y-3">
            {primite.map((c) => (
              <Card key={c.id} className="lift-on-hover flex items-center justify-between">
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
          <SectionLabel icon={<Send className="h-3.5 w-3.5" />}>Cereri trimise</SectionLabel>
          <div className="mt-3 space-y-3">
            {trimise.map((c) => (
              <Card key={c.id} className="lift-on-hover flex items-center justify-between">
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
        <SectionLabel icon={<Handshake className="h-3.5 w-3.5" />}>Conexiunile mele</SectionLabel>
        <div className="mt-3 space-y-3">
          {acceptate.length === 0 && (
            <p className="text-sm text-ink-soft">Nicio conexiune activă încă.</p>
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
      {/* Cereri de oferta */}
      <section className="mt-8" id="cereri">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel icon={<FileText className="h-3.5 w-3.5" />}>Cereri de ofertă</SectionLabel>
          <div className="flex items-center gap-2">
            <Link
              href={arataArhivate ? "/dashboard" : "/dashboard?arhivate=1#cereri"}
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
            >
              <Archive className="h-3 w-3" /> {arataArhivate ? "Arată active" : "Arată arhivate"}
            </Link>
            {!arataArhivate && (
              <LinkButton href="/dashboard/cereri/noua" variant="seal" size="sm" className="shrink-0">
                <Plus className="h-3.5 w-3.5" /> Cerere nouă
              </LinkButton>
            )}
          </div>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
              Trimise de mine
            </p>
            <div className="space-y-2">
              {cereriTrimise.length === 0 && (
                <p className="text-sm text-ink-soft">
                  {arataArhivate ? "Nicio cerere arhivată." : "Nicio cerere trimisă încă."}
                </p>
              )}
              {cereriTrimise.map((c) => (
                <Card key={c.id} className="lift-on-hover flex items-center gap-2 p-4">
                  <Link href={`/dashboard/cereri/${c.id}`} className="block min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{c.titlu}</p>
                    <p className="mt-1 font-mono-num text-xs text-ink-soft">
                      {new Date(c.created_at).toLocaleDateString("ro-RO")}
                    </p>
                  </Link>
                  <ArchiveButton kind="rfq" itemId={c.id} companyId={c.requester_company_id} arhivat={arataArhivate} />
                </Card>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
              Primite
            </p>
            <div className="space-y-2">
              {cereriPrimite.length === 0 && (
                <p className="text-sm text-ink-soft">
                  {arataArhivate ? "Nicio cerere arhivată." : "Nicio cerere primită încă."}
                </p>
              )}
              {cereriPrimite.map((c) =>
                c.rfqs ? (
                  <Card key={c.rfq_id} className="lift-on-hover flex items-center gap-2 p-4">
                    <Link href={`/dashboard/cereri/${c.rfqs.id}`} className="block min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{c.rfqs.titlu}</p>
                      <p className="mt-1 font-mono-num text-xs text-ink-soft">
                        {new Date(c.rfqs.created_at).toLocaleDateString("ro-RO")}
                      </p>
                    </Link>
                    <ArchiveButton kind="rfq" itemId={c.rfqs.id} companyId={c.company_id} arhivat={arataArhivate} />
                  </Card>
                ) : null
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Înțelegeri */}
      <section className="mt-8" id="intelegeri">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel icon={<Handshake className="h-3.5 w-3.5" />}>Înțelegeri</SectionLabel>
          <Link
            href={arataArhivate ? "/dashboard" : "/dashboard?arhivate=1#intelegeri"}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
          >
            <Archive className="h-3 w-3" /> {arataArhivate ? "Arată active" : "Arată arhivate"}
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {intelegeri.length === 0 && (
            <p className="text-sm text-ink-soft">
              {arataArhivate
                ? "Nicio înțelegere arhivată."
                : "Nicio înțelegere încă. Pornesc dintr-un răspuns la o cerere de ofertă."}
            </p>
          )}
          {intelegeri.map((d) => (
            <Card key={d.id} className="lift-on-hover flex items-center justify-between gap-3 p-4">
              <Link href={`/dashboard/intelegeri/${d.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{d.titlu}</p>
                <p className="mt-0.5 font-mono-num text-xs text-ink-soft">
                  {new Date(d.updated_at).toLocaleDateString("ro-RO")}
                </p>
              </Link>
              <Badge
                tone={
                  d.status === "finalizat" || d.status === "acceptat" ? "success"
                  : d.status === "anulat" ? "danger"
                  : "warning"
                }
              >
                {d.status === "draft" ? "ciornă"
                  : d.status === "negociere" ? "în negociere"
                  : d.status === "acceptat" ? "acceptată"
                  : d.status === "finalizat" ? "finalizată"
                  : "anulată"}
              </Badge>
              <ArchiveButton
                kind="deal"
                itemId={d.id}
                companyId={companyIds.includes(d.company_a_id) ? d.company_a_id : d.company_b_id}
                arhivat={arataArhivate}
              />
            </Card>
          ))}
        </div>
      </section>

      {/* Favorite */}
      <section className="mt-8">
        <SectionLabel icon={<Bookmark className="h-3.5 w-3.5" />}>Firme salvate</SectionLabel>
        <div className="mt-3 space-y-3">
          {favorite.length === 0 && (
            <p className="text-sm text-ink-soft">Nicio firmă salvată încă.</p>
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
