import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import type { NewsArticle } from "@/types/database";

export default async function StireDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { t, locale } = await getT();

  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publicat")
    .maybeSingle();

  const articol = data as NewsArticle | null;
  if (!articol) notFound();

  const paragrafe = articol.continut.split(/\n{2,}/).filter(Boolean);
  const dateLocale = locale === "en" ? "en-US" : "ro-RO";

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/stiri" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> {t.news.allNews}
      </Link>

      <p className="stamp-label mt-6 text-seal">
        {articol.published_at
          ? new Date(articol.published_at).toLocaleDateString(dateLocale, { day: "2-digit", month: "long", year: "numeric" })
          : ""}
      </p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{articol.titlu}</h1>
      {articol.rezumat && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{articol.rezumat}</p>}

      {articol.imagine_url ? (
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-ink/5">
          <Image src={articol.imagine_url} alt="" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="mt-8 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl bg-ink/5 text-ink-soft/30">
          <Newspaper className="h-10 w-10" strokeWidth={1.4} />
        </div>
      )}

      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-ink">
        {paragrafe.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
