import { redirect } from "next/navigation";
import Link from "next/link";
import { Pencil, ExternalLink, Bookmark, Building2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, SectionLabel } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { EmailUnverifiedBanner } from "@/components/EmailUnverifiedBanner";
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

  const { data: favoriteData } = await supabase
    .from("company_favorites")
    .select("companies(id, denumire, slug)")
    .eq("profile_id", user.id);
  const favorite =
    (favoriteData as unknown as { companies: { id: string; denumire: string; slug: string | null } | null }[] | null)
      ?.map((f) => f.companies)
      .filter((c): c is { id: string; denumire: string; slug: string | null } => Boolean(c)) ?? [];

  const { data: profileData } = await supabase
    .from("profiles")
    .select(
      "email_verificat, avatar_url, titlu, firma_declarata, judet_cod, oras, bio, linkedin_url, cauta_suport, cauta_suport_category_ids"
    )
    .eq("id", user.id)
    .maybeSingle();
  const profil = profileData as {
    email_verificat: boolean;
    avatar_url: string | null;
    titlu: string | null;
    firma_declarata: string | null;
    judet_cod: string | null;
    oras: string | null;
    bio: string | null;
    linkedin_url: string | null;
    cauta_suport: string | null;
    cauta_suport_category_ids: string[] | null;
  } | null;
  const emailVerificat = profil?.email_verificat ?? true;

  // completarea profilului — model AER ("Completeaza-ti profilul 25%")
  const campuriProfil = [
    Boolean(profil?.titlu),
    Boolean(profil?.firma_declarata),
    Boolean(profil?.judet_cod),
    Boolean(profil?.oras),
    Boolean(profil?.bio),
    Boolean(profil?.cauta_suport || profil?.cauta_suport_category_ids?.length),
    Boolean(profil?.avatar_url),
    Boolean(profil?.linkedin_url),
  ];
  const procentProfil = Math.round((campuriProfil.filter(Boolean).length / campuriProfil.length) * 100);
  const primulCampLipsa = !profil?.avatar_url
    ? "Adaugă poza de profil"
    : !profil?.linkedin_url
      ? "Adaugă link-ul de LinkedIn"
      : !profil?.bio
        ? "Completează descrierea"
        : "Completează profilul";

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      {!emailVerificat && user.email && <EmailUnverifiedBanner email={user.email} />}

      {procentProfil < 100 && (
        <Link
          href="/dashboard/profil"
          className="lift-on-hover mb-6 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-sm)] transition"
        >
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-seal) ${procentProfil * 3.6}deg, var(--color-line) 0deg)`,
            }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface">
              <span className="font-mono-num text-xs font-bold text-ink">{procentProfil}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="stamp-label text-seal">Completează-ți profilul</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-ink">{primulCampLipsa}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft" />
        </Link>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="stamp-label text-seal">Panoul tău</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">Contul meu</h1>
        </div>
        <LinkButton href="/inregistrare/firma" variant="secondary" size="sm">Adaugă altă firmă</LinkButton>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton href="/dashboard/profil" variant="secondary" size="sm">Profilul meu public</LinkButton>
        <LinkButton href="/mesaje" variant="secondary" size="sm">Mesajele mele</LinkButton>
        <LinkButton href="/membri" variant="secondary" size="sm">Caută membri</LinkButton>
      </div>

      {/* Firmele mele */}
      <section className="mt-8">
        <SectionLabel icon={<Building2 className="h-3.5 w-3.5" />}>Firmele mele</SectionLabel>
        <div className="mt-3 space-y-3">
          {companies.length === 0 && (
            <div className="block-inset flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-soft">
                Nu ai nicio firmă înregistrată — nicio problemă, poți folosi contul și așa. Dacă
                vrei, poți adăuga oricând o firmă.
              </p>
              <LinkButton href="/inregistrare/firma" variant="seal" size="sm" className="shrink-0">
                Adaugă o firmă
              </LinkButton>
            </div>
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

      {/* Firme salvate */}
      {favorite.length > 0 && (
        <section className="mt-8">
          <SectionLabel icon={<Bookmark className="h-3.5 w-3.5" />}>Firme salvate</SectionLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {favorite.map((f) => (
              <Card key={f.id} className="lift-on-hover">
                <Link href={`/firma/${f.slug ?? f.id}`} className="font-medium text-ink hover:text-seal">
                  {f.denumire}
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
