import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Globe, Phone, Mail, MapPin, Users, TrendingUp, Building2, Star, Eye, Images } from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";
import { VerifiedStamp } from "@/components/ui/VerifiedStamp";
import { ConnectButton } from "@/components/ConnectButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReviewForm } from "@/components/ReviewForm";
import type { Company, Profile, CompanyContact, CompanyProject } from "@/types/database";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: companyData } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!companyData) notFound();
  const company = companyData as Company;

  // vizualizare (best-effort, nu blocheaza randarea daca esueaza)
  createServiceRoleClient()
    .rpc("increment_company_view", { target_company_id: id } as never)
    .then(() => {});

  const [
    { data: judetData },
    { data: categoriiData },
    { data: nevoiData },
    { data: oferteData },
    { data: financiarData },
    { data: contacteData },
    { data: proiecteData },
    { data: recenziiData },
    { data: ratingData },
  ] = await Promise.all([
    company.judet_cod
      ? supabase.from("judete").select("nume").eq("cod", company.judet_cod).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("company_categories")
      .select("is_primary, categories(id, name_ro, slug)")
      .eq("company_id", id),
    supabase.from("company_support_needs").select("nota, categories(name_ro)").eq("company_id", id),
    supabase.from("company_support_offers").select("nota, categories(name_ro)").eq("company_id", id),
    supabase
      .from("financial_snapshots")
      .select("an, cifra_afaceri, numar_salariati")
      .eq("company_id", id)
      .order("an", { ascending: false })
      .limit(1),
    supabase.from("company_contacts").select("*").eq("company_id", id).order("ordine"),
    supabase.from("company_projects").select("*").eq("company_id", id).order("created_at", { ascending: false }).limit(6),
    supabase
      .from("reviews")
      .select("id, rating, comentariu, created_at, reviewer:reviewer_company_id(id, denumire)")
      .eq("reviewed_company_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    supabase.rpc("company_rating", { target_company_id: id } as never),
  ]);

  const judetNume = (judetData as { nume: string } | null)?.nume ?? null;
  const categorii =
    (categoriiData as unknown as { is_primary: boolean; categories: { id: string; name_ro: string; slug: string } | null }[]) ??
    [];
  const nevoi = (nevoiData as unknown as { nota: string | null; categories: { name_ro: string } | null }[]) ?? [];
  const oferte = (oferteData as unknown as { nota: string | null; categories: { name_ro: string } | null }[]) ?? [];
  const financiar = (financiarData as { an: number; cifra_afaceri: number | null; numar_salariati: number | null }[] | null)?.[0];
  const contacte = (contacteData as CompanyContact[]) ?? [];
  const proiecte = (proiecteData as CompanyProject[]) ?? [];
  const recenzii =
    (recenziiData as unknown as { id: string; rating: number; comentariu: string | null; created_at: string; reviewer: { id: string; denumire: string } | null }[]) ?? [];
  const rating = (ratingData as unknown as { medie: number; numar: number }[] | null)?.[0] ?? { medie: 0, numar: 0 };

  // ---- reprezentant (date personale) — RLS decide daca randul e vizibil -----
  const { data: profileData } = await supabase
    .from("profiles")
    .select("nume_complet, telefon_personal, email_personal")
    .eq("id", company.owner_id)
    .maybeSingle();
  const profil = profileData as Pick<Profile, "nume_complet" | "telefon_personal" | "email_personal"> | null;

  // ---- stare conexiune / eligibilitate recenzie pentru vizitatorul curent ----
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let connectionId: string | null = null;
  let stareConexiune: "none" | "pending_sent" | "pending_received" | "accepted" | "declined" = "none";
  let firmaVizitatorId: string | null = null;
  let poateRecenza = false;

  if (user) {
    const { data: myCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    firmaVizitatorId = (myCompany as { id: string } | null)?.id ?? null;

    if (firmaVizitatorId && firmaVizitatorId !== id) {
      const { data: conn } = await supabase
        .from("connections")
        .select("id, status, requester_company_id")
        .or(
          `and(requester_company_id.eq.${firmaVizitatorId},target_company_id.eq.${id}),and(requester_company_id.eq.${id},target_company_id.eq.${firmaVizitatorId})`
        )
        .maybeSingle();

      if (conn) {
        const c = conn as { id: string; status: string; requester_company_id: string };
        connectionId = c.id;
        if (c.status === "accepted") stareConexiune = "accepted";
        else if (c.status === "declined") stareConexiune = "declined";
        else stareConexiune = c.requester_company_id === firmaVizitatorId ? "pending_sent" : "pending_received";
      }

      const { data: recenzieExistenta } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_company_id", firmaVizitatorId)
        .eq("reviewed_company_id", id)
        .maybeSingle();

      poateRecenza = !recenzieExistenta;
    }
  }

  const domeniuPrincipal = categorii.find((c) => c.is_primary)?.categories?.name_ro;
  const domeniiSecundare = categorii.filter((c) => !c.is_primary && c.categories);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      {company.status !== "approved" && (
        <div className="mb-6 rounded-lg bg-seal/10 px-4 py-2.5 text-sm text-seal">
          Acest profil nu e încă public — îl vezi pentru că ești proprietarul sau un administrator.
        </div>
      )}

      {/* Banner + avatar */}
      <div className="relative h-40 w-full overflow-hidden rounded-xl bg-ink/5 sm:h-56">
        {company.banner_url && (
          <Image src={company.banner_url} alt="" fill className="object-cover" unoptimized />
        )}
        <div className="absolute -bottom-8 left-6 h-20 w-20 overflow-hidden rounded-full border-4 border-paper bg-paper-white sm:h-24 sm:w-24">
          {company.logo_url ? (
            <Image src={company.logo_url} alt={company.denumire} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-ink/25">
              <Building2 className="h-8 w-8" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-11 flex items-start justify-between gap-4">
        <div>
          {domeniuPrincipal && (
            <p className="text-xs font-medium uppercase tracking-wide text-seal">{domeniuPrincipal}</p>
          )}
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{company.denumire}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {[company.localitate, judetNume].filter(Boolean).join(", ") || "—"}
            </span>
            {rating.numar > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-seal text-seal" />
                {rating.medie.toFixed(1)} ({rating.numar})
              </span>
            )}
            <span className="flex items-center gap-1 text-ink/40">
              <Eye className="h-3.5 w-3.5" /> {company.vizualizari}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <VerifiedStamp size="md" />
          <FavoriteButton companyId={company.id} />
        </div>
      </div>

      {company.descriere && <p className="mt-6 max-w-2xl leading-relaxed text-ink/75">{company.descriere}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {domeniiSecundare.map((c) => (
          <Badge key={c.categories!.id}>{c.categories!.name_ro}</Badge>
        ))}
        {company.dimensiune_echipa && (
          <Badge tone="neutral">
            <Users className="mr-1 h-3 w-3 inline" /> {company.dimensiune_echipa} angajați
          </Badge>
        )}
        {financiar?.cifra_afaceri != null && (
          <Badge tone="success">
            <TrendingUp className="mr-1 h-3 w-3 inline" />
            {financiar.cifra_afaceri.toLocaleString("ro-RO")} lei ({financiar.an})
          </Badge>
        )}
      </div>

      {company.tags && company.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {company.tags.map((t) => (
            <span key={t} className="rounded-full bg-ink/6 px-2.5 py-1 text-xs text-ink/60">
              {t}
            </span>
          ))}
        </div>
      )}

      {(company.facebook_url || company.instagram_url || company.linkedin_url) && (
        <div className="mt-4 flex gap-3">
          {company.facebook_url && (
            <a href={company.facebook_url} target="_blank" rel="noopener noreferrer" className="text-ink/40 hover:text-seal">
              <FacebookIcon className="h-5 w-5" />
            </a>
          )}
          {company.instagram_url && (
            <a href={company.instagram_url} target="_blank" rel="noopener noreferrer" className="text-ink/40 hover:text-seal">
              <InstagramIcon className="h-5 w-5" />
            </a>
          )}
          {company.linkedin_url && (
            <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-ink/40 hover:text-seal">
              <LinkedinIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Contact firmă</h2>
          <div className="mt-3 space-y-2 text-sm">
            {company.telefon_firma && (
              <p className="flex items-center gap-2 text-ink/80"><Phone className="h-4 w-4 text-ink/40" /> {company.telefon_firma}</p>
            )}
            {company.email_firma && (
              <p className="flex items-center gap-2 text-ink/80"><Mail className="h-4 w-4 text-ink/40" /> {company.email_firma}</p>
            )}
            {company.website && (
              <p className="flex items-center gap-2 text-ink/80">
                <Globe className="h-4 w-4 text-ink/40" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-seal hover:underline">
                  {company.website}
                </a>
              </p>
            )}
            <p className="flex items-center gap-2 text-ink/50">
              <Building2 className="h-4 w-4 text-ink/40" /> CUI <span className="font-mono-num">{company.cui}</span>
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Reprezentant</h2>
          {profil ? (
            <div className="mt-3 space-y-1 text-sm text-ink/80">
              <p className="font-medium text-ink">{profil.nume_complet}</p>
              {profil.telefon_personal && <p>{profil.telefon_personal}</p>}
              {profil.email_personal && <p>{profil.email_personal}</p>}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/50">Vizibil doar pentru firmele conectate.</p>
          )}
          <div className="mt-4">
            <ConnectButton
              targetCompanyId={company.id}
              connectionId={connectionId}
              stareInitiala={stareConexiune}
              autentificat={Boolean(user)}
            />
          </div>
        </Card>
      </div>

      {contacte.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Persoane de contact</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {contacte.map((c) => (
              <div key={c.id} className="text-sm">
                <p className="font-medium text-ink">{c.nume}</p>
                <p className="text-ink/55">{[c.rol, c.departament].filter(Boolean).join(" · ")}</p>
                <p className="text-ink/55">{[c.telefon, c.email].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(nevoi.length > 0 || oferte.length > 0) && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {nevoi.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Caută ajutor în</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-ink/75">
                {nevoi.map((n, i) => (
                  <li key={i}>• {n.categories?.name_ro ?? ""} {n.nota && `— ${n.nota}`}</li>
                ))}
              </ul>
            </Card>
          )}
          {oferte.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Poate ajuta cu</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-ink/75">
                {oferte.map((o, i) => (
                  <li key={i}>• {o.categories?.name_ro ?? ""} {o.nota && `— ${o.nota}`}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {proiecte.length > 0 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
            <Images className="h-4 w-4" /> Portofoliu
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {proiecte.map((p) => (
              <Link
                key={p.id}
                href={`/firma/${id}/portofoliu/${p.id}`}
                className="lift-on-hover overflow-hidden rounded-xl border border-line bg-paper-white"
              >
                <div className="relative h-28 w-full bg-ink/5">
                  {p.cover_url && <Image src={p.cover_url} alt={p.titlu} fill className="object-cover" unoptimized />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-ink">{p.titlu}</p>
                  {p.locatie && <p className="text-xs text-ink/50">{p.locatie}{p.an ? ` · ${p.an}` : ""}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Recenzii {rating.numar > 0 && `(${rating.numar})`}
        </h2>

        {recenzii.length > 0 && (
          <div className="mt-3 space-y-3">
            {recenzii.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-seal text-seal" : "text-ink/20"}`} />
                  ))}
                  <Link href={`/firma/${r.reviewer?.id}`} className="text-xs font-medium text-ink/60 hover:text-seal">
                    {r.reviewer?.denumire}
                  </Link>
                </div>
                {r.comentariu && <p className="mt-2 text-sm text-ink/75">{r.comentariu}</p>}
              </Card>
            ))}
          </div>
        )}
        {recenzii.length === 0 && <p className="mt-2 text-sm text-ink/50">Nicio recenzie publicată încă.</p>}

        {poateRecenza && firmaVizitatorId && (
          <div className="mt-4">
            <ReviewForm reviewedCompanyId={id} reviewerCompanyId={firmaVizitatorId} />
          </div>
        )}
      </div>
    </div>
  );
}
