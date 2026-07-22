import { SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { geocodeAddress } from "@/lib/geocode";
import { CatalogFilters } from "./CatalogFilters";
import { CompanyCard, type CompanyCardData } from "@/components/CompanyCard";
import type { Category, Judet } from "@/types/database";

interface CompanyRow {
  id: string;
  slug: string | null;
  denumire: string;
  logo_url: string | null;
  judet_cod: string | null;
  localitate: string | null;
  dimensiune_echipa: string | null;
  descriere: string | null;
  rating_mediu: number;
  rating_numar: number;
  timp_raspuns: string | null;
  discount_procent: number | null;
  proiect_marime: string | null;
  data_inregistrare: string | null;
  created_at: string;
}

const CAMPURI =
  "id, slug, denumire, logo_url, judet_cod, localitate, dimensiune_echipa, descriere, " +
  "rating_mediu, rating_numar, timp_raspuns, discount_procent, proiect_marime, " +
  "data_inregistrare, created_at";

/** Pragul de la care o firma nu mai e considerata "noua". Extras intr-o
 *  functie ca sa nu apelam Date.now() direct in randare. */
function pragFirmeNoi(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

/** Scoate caracterele care ar strica sintaxa .or() din PostgREST (virgula, paranteze). */
function sanitizeazaTermenCautare(raw: string): string {
  return raw.replace(/[,()]/g, " ").trim();
}

/** Scapă wildcard-urile ILIKE (%, _) ca sa fie tratate ca text literal, nu pattern. */
function escapeazaIlike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { t } = await getT();

  const [{ data: judeteData }, { data: categoriiData }] = await Promise.all([
    supabase.from("judete").select("cod, nume").order("nume"),
    supabase.from("categories").select("id, slug, name_ro, name_en, parent_id, ordine, created_at")
      .is("parent_id", null)
      .order("ordine"),
  ]);

  const judete = (judeteData as Judet[]) ?? [];
  const categorii = (categoriiData as Category[]) ?? [];
  const judeteMap = new Map(judete.map((j) => [j.cod, j.nume]));

  let categoryId: string | null = null;
  if (params.categorie) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.categorie)
      .maybeSingle();
    categoryId = (data as { id: string } | null)?.id ?? null;
  }

  // ---- cautare: potrivim termenul si pe numele domeniului (categoriei) -----
  // (numele/descrierea firmei se cauta direct in interogarea principala, mai jos)
  let idFirmeDinDomeniuCautat: string[] | null = null;
  if (params.q) {
    const qSigur = escapeazaIlike(sanitizeazaTermenCautare(params.q));
    if (qSigur) {
      const { data: categoriiPotrivite } = await supabase
        .from("categories")
        .select("id")
        .or(`name_ro.ilike.%${qSigur}%,name_en.ilike.%${qSigur}%`);
      const idCategoriiPotrivite = (categoriiPotrivite as { id: string }[] | null)?.map((c) => c.id) ?? [];
      if (idCategoriiPotrivite.length > 0) {
        const { data: firmeDinDomeniu } = await supabase
          .from("company_categories")
          .select("company_id")
          .in("category_id", idCategoriiPotrivite);
        idFirmeDinDomeniuCautat = Array.from(
          new Set((firmeDinDomeniu as { company_id: string }[] | null)?.map((r) => r.company_id) ?? [])
        );
      } else {
        idFirmeDinDomeniuCautat = [];
      }
    }
  }

  // ---- cautare pe raza (optionala) ----------------------------------------
  let distanteMap: Map<string, number> | null = null;
  if (params.locatie) {
    const geo = await geocodeAddress(params.locatie);
    if (geo) {
      const { data: rpcData } = await supabase.rpc("search_companies_serving_point", {
        target_lat: geo.lat,
        target_lng: geo.lng,
      } as never);
      const rows = (rpcData as { company_id: string; distanta_km: number }[]) ?? [];
      distanteMap = new Map(rows.map((r) => [r.company_id, r.distanta_km]));
    } else {
      distanteMap = new Map();
    }
  }

  // ---- interogarea principala ----------------------------------------------
  let query = supabase
    .from("companies")
    .select(categoryId ? `${CAMPURI}, company_categories!inner(category_id)` : CAMPURI)
    .eq("status", "approved")
    .limit(60);

  // Sortare — implicit cele mai bine cotate, apoi cele mai noi. Firmele fara
  // recenzii nu sunt penalizate: raman dupa cele cotate, ordonate cronologic.
  const sortare = params.sortare ?? "relevanta";
  switch (sortare) {
    case "rating_desc":
      query = query.order("rating_mediu", { ascending: false }).order("rating_numar", { ascending: false });
      break;
    case "recente":
      query = query.order("created_at", { ascending: false });
      break;
    case "vechime_desc":
      query = query.order("data_inregistrare", { ascending: true, nullsFirst: false });
      break;
    case "nume_asc":
      query = query.order("denumire", { ascending: true });
      break;
    default:
      query = query
        .order("rating_numar", { ascending: false })
        .order("rating_mediu", { ascending: false })
        .order("created_at", { ascending: false });
  }

  if (params.q) {
    const qSigur = escapeazaIlike(sanitizeazaTermenCautare(params.q));
    const conditii = [`denumire.ilike.%${qSigur}%`, `descriere.ilike.%${qSigur}%`, `domenii_altele.ilike.%${qSigur}%`];
    if (idFirmeDinDomeniuCautat && idFirmeDinDomeniuCautat.length > 0) {
      conditii.push(`id.in.(${idFirmeDinDomeniuCautat.join(",")})`);
    }
    query = query.or(conditii.join(","));
  }
  if (params.judet) query = query.eq("judet_cod", params.judet);
  if (categoryId) query = query.eq("company_categories.category_id", categoryId);
  if (distanteMap) query = query.in("id", Array.from(distanteMap.keys()));
  if (params.echipa) query = query.eq("dimensiune_echipa", params.echipa);
  if (params.proiect) query = query.eq("proiect_marime", params.proiect);
  if (params.reduceri === "1") query = query.not("discount_procent", "is", null);
  if (params.noi === "1") {
    query = query.gte("created_at", pragFirmeNoi());
  }

  const { data: companiesData, error } = await query;
  if (error) console.error("Eroare interogare catalog:", error);
  const companies = (companiesData as unknown as CompanyRow[]) ?? [];

  // ---- domeniul principal pentru fiecare firma (query separat, batched) -----
  const ids = companies.map((c) => c.id);
  const domeniiMap = new Map<string, string>();
  if (ids.length > 0) {
    const { data: catData } = await supabase
      .from("company_categories")
      .select("company_id, is_primary, categories(name_ro)")
      .in("company_id", ids)
      .eq("is_primary", true);

    (catData as unknown as { company_id: string; categories: { name_ro: string } | null }[] | null)?.forEach(
      (row) => {
        if (row.categories) domeniiMap.set(row.company_id, row.categories.name_ro);
      }
    );
  }

  let cards: CompanyCardData[] = companies.map((c) => ({
    id: c.id,
    slug: c.slug,
    discount_procent: c.discount_procent,
    created_at: c.created_at,
    denumire: c.denumire,
    logo_url: c.logo_url,
    judet_nume: c.judet_cod ? judeteMap.get(c.judet_cod) ?? null : null,
    localitate: c.localitate,
    dimensiune_echipa: c.dimensiune_echipa,
    descriere: c.descriere,
    domeniu_principal: domeniiMap.get(c.id) ?? null,
    distanta_km: distanteMap?.get(c.id),
    rating_mediu: c.rating_mediu,
    rating_numar: c.rating_numar,
    timp_raspuns: c.timp_raspuns,
  }));

  if (distanteMap) {
    cards = cards.sort((a, b) => (a.distanta_km ?? 999) - (b.distanta_km ?? 999));
  }

  return (
    <>
      {/* antet de pagina, cu fundal propriu — delimiteaza clar zona de cautare */}
      <div className="mesh-hero relative overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 grid-registry" />
        <div className="relative mx-auto max-w-6xl px-5 pb-8 pt-12">
          <p className="stamp-label text-seal">{t.catalog.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t.catalog.title}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            <span className="font-mono-num font-semibold text-ink">{cards.length}</span> {t.catalog.countSuffix}
            {params.locatie && ` · ${t.catalog.sortedByDistance}`}
          </p>

          <div className="mt-6">
            <CatalogFilters categorii={categorii} judete={judete} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10">
        {error && (
          <div className="block-base border-rust/30 bg-rust/8 p-5">
            <p className="font-semibold text-rust">A apărut o eroare la încărcarea firmelor.</p>
            <p className="mt-1.5 font-mono-num text-xs text-rust/80">{error.message}</p>
            <p className="mt-2 text-xs text-ink-soft">
              Cel mai frecvent motiv: o migrare SQL nerulată încă în Supabase (verifică în Table
              Editor dacă există coloanele/tabelele folosite). Vezi README-ul, secțiunea 3.2.
            </p>
          </div>
        )}

        {!error && cards.length === 0 && (
          <div className="block-inset flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/5 ring-1 ring-inset ring-line">
              <SearchX className="h-6 w-6 text-ink-soft/50" strokeWidth={1.6} />
            </div>
            <p className="mt-4 font-semibold text-ink">{t.catalog.noResultsTitle}</p>
            <p className="mt-1 max-w-sm text-sm text-ink-soft">
              {t.catalog.noResultsBody}
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      </div>
    </>
  );
}
