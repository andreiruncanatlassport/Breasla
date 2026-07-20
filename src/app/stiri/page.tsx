import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { NewsCard, type NewsCardData } from "@/components/NewsCard";

export const metadata = { title: "Știri — Rețeaua Antreprenorilor Creștini" };

export default async function StiriPage() {
  const supabase = await createClient();
  const { t } = await getT();
  const { data } = await supabase
    .from("news_articles")
    .select("slug, titlu, rezumat, imagine_url, published_at")
    .eq("status", "publicat")
    .order("published_at", { ascending: false })
    .limit(60);

  const stiri = (data as NewsCardData[]) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-xl">
        <p className="stamp-label text-seal">{t.news.eyebrow}</p>
        <h1 className="mt-2 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          <Newspaper className="h-7 w-7 text-seal" strokeWidth={1.8} />
          {t.news.title}
        </h1>
        <p className="mt-3 text-base text-ink-soft">{t.news.subtitle}</p>
      </div>

      {stiri.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">{t.news.empty}</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stiri.map((s) => (
            <NewsCard key={s.slug} article={s} readMoreLabel={t.news.readMore} />
          ))}
        </div>
      )}
    </div>
  );
}
