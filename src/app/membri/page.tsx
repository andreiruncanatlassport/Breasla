import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { MemberCard, type MemberCardData } from "@/components/MemberCard";

export const metadata = { title: "Membri — Rețeaua Antreprenorilor Creștini" };

export default async function MembriPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const supabase = await createClient();
  const { t } = await getT();

  let query = supabase
    .from("member_directory")
    .select("id, nume_complet, avatar_url, titlu, oras, company_denumire, company_slug")
    .order("created_at", { ascending: false })
    .limit(90);

  if (q) {
    query = query.or(`nume_complet.ilike.%${q}%,company_denumire.ilike.%${q}%,titlu.ilike.%${q}%`);
  }

  const { data } = await query;
  const membri = (data as MemberCardData[]) ?? [];

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

      <form className="mt-8 max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder={t.members.searchPlaceholder}
          className="w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink shadow-[inset_0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-200 placeholder:text-ink-soft/60 focus:border-seal focus:ring-3 focus:ring-seal/12"
        />
      </form>

      {membri.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">
          {q ? t.members.emptySearch : t.members.empty}
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {membri.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
