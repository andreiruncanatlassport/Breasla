import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import { CatalogFilters } from "./CatalogFilters";
import { CompanyCard, type CompanyCardData } from "@/components/CompanyCard";
import type { Category, Judet } from "@/types/database";

interface CompanyRow {
  id: string;
  denumire: string;
  judet_cod: string | null;
  localitate: string | null;
  dimensiune_echipa: string | null;
  descriere: string | null;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

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
    .select(
      categoryId
        ? "id, denumire, judet_cod, localitate, dimensiune_echipa, descriere, company_categories!inner(category_id)"
        : "id, denumire, judet_cod, localitate, dimensiune_echipa, descriere"
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(60);

  if (params.q) query = query.ilike("denumire", `%${params.q}%`);
  if (params.judet) query = query.eq("judet_cod", params.judet);
  if (categoryId) query = query.eq("company_categories.category_id", categoryId);
  if (distanteMap) query = query.in("id", Array.from(distanteMap.keys()));

  const { data: companiesData, error } = await query;
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
    denumire: c.denumire,
    judet_nume: c.judet_cod ? judeteMap.get(c.judet_cod) ?? null : null,
    localitate: c.localitate,
    dimensiune_echipa: c.dimensiune_echipa,
    descriere: c.descriere,
    domeniu_principal: domeniiMap.get(c.id) ?? null,
    distanta_km: distanteMap?.get(c.id),
  }));

  if (distanteMap) {
    cards = cards.sort((a, b) => (a.distanta_km ?? 999) - (b.distanta_km ?? 999));
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-2xl font-semibold text-ink">Catalog firme</h1>
      <p className="mt-1 text-sm text-ink/60">
        {cards.length} firme verificate {params.locatie && "· sortate după distanță"}
      </p>

      <div className="mt-6">
        <CatalogFilters categorii={categorii} judete={judete} />
      </div>

      {error && (
        <p className="mt-8 text-sm text-rust">A apărut o eroare la încărcarea firmelor.</p>
      )}

      {!error && cards.length === 0 && (
        <p className="mt-16 text-center text-sm text-ink/50">
          Nicio firmă găsită pentru filtrele alese. Încearcă să lărgești căutarea.
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <CompanyCard key={c.id} company={c} />
        ))}
      </div>
    </div>
  );
}
