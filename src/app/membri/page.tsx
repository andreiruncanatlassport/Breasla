import { Users, SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { MemberCard, type MemberCardData } from "@/components/MemberCard";
import { MembriFilters } from "./MembriFilters";
import type { Judet } from "@/types/database";

export const metadata = { title: "Membri — Rețeaua Antreprenorilor Creștini" };

/** Scoate caracterele care ar strica sintaxa .or() din PostgREST. */
function sanitizeazaTermenCautare(q: string): string {
  return q.replace(/[,()]/g, " ").trim();
}

export default async function MembriPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const q = sanitizeazaTermenCautare(params.q ?? "");
  const judet = params.judet ?? "";
  const firma = params.firma ?? "";
  const nevoieIds = (params.nevoie ?? "").split(",").filter(Boolean);

  const supabase = await createClient();
  const { t } = await getT();

  const [{ data: judeteData }, { data: categoriiData }] = await Promise.all([
    supabase.from("judete").select("cod, nume").order("nume"),
    supabase.from("categories").select("id, name_ro").is("parent_id", null).order("ordine"),
  ]);
  const judete = (judeteData as Judet[]) ?? [];
  const tagOptions = ((categoriiData as { id: string; name_ro: string }[]) ?? []).map((c) => ({
    id: c.id,
    label: c.name_ro,
  }));

  let query = supabase
    .from("member_directory")
    .select(
      "id, nume_complet, avatar_url, titlu, oras, judet_cod, judet_nume, firma_declarata, cauta_suport, cauta_suport_category_ids, verificat, nr_recomandari, company_denumire, company_slug"
    )
    .order("nr_recomandari", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(90);

  if (q) {
    query = query.or(
      `nume_complet.ilike.%${q}%,company_denumire.ilike.%${q}%,titlu.ilike.%${q}%,cauta_suport.ilike.%${q}%,oras.ilike.%${q}%,bio.ilike.%${q}%,company_domenii_text.ilike.%${q}%,cauta_suport_tags_text.ilike.%${q}%,firma_declarata.ilike.%${q}%,company_descriere.ilike.%${q}%`
    );
  }
  if (judet) query = query.eq("judet_cod", judet);
  if (firma === "cu") query = query.not("company_id", "is", null);
  if (firma === "fara") query = query.is("company_id", null);
  if (nevoieIds.length > 0) query = query.overlaps("cauta_suport_category_ids", nevoieIds);
  if (params.verificat === "1") query = query.eq("verificat", true);

  const { data } = await query;
  const membri = (data as MemberCardData[]) ?? [];
  const areFiltre = Boolean(q || judet || firma || nevoieIds.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-xl">
        <p className="stamp-label text-seal">{t.members.eyebrow}</p>
        <h1 className="mt-2 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          <Users className="h-7 w-7 text-seal" strokeWidth={1.8} />
          {t.members.title}
        </h1>
        <p className="mt-3 text-base text-ink-soft">{t.members.subtitle}</p>
      </div>

      <MembriFilters judete={judete} tagOptions={tagOptions} />

      {membri.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/5 ring-1 ring-inset ring-line">
            <SearchX className="h-6 w-6 text-ink-soft/50" strokeWidth={1.6} />
          </div>
          <p className="mt-4 font-semibold text-ink">{areFiltre ? t.members.emptySearch : t.members.empty}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {membri.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
