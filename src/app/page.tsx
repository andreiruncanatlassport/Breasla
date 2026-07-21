import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Users, LockKeyhole, Newspaper, CalendarDays, FileCheck2, Handshake, Building2, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/Button";
import { BrandMark } from "@/components/ui/BrandMark";
import { RecentCompaniesTicker } from "@/components/RecentCompaniesTicker";
import { HomeStats } from "@/components/HomeStats";
import { NewsCard, type NewsCardData } from "@/components/NewsCard";
import { EventCard, type EventCardData } from "@/components/EventCard";

const STEP_TINTS = ["bg-seal", "bg-teal", "bg-navy"];

export default async function HomePage() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const dateLocale = locale === "en" ? "en-US" : "ro-RO";
  const eventLabels = {
    conferinta: t.events.typeConference,
    workshop: t.events.typeWorkshop,
    networking: t.events.typeNetworking,
    altul: t.events.typeOther,
    online: t.events.online,
    full: t.events.full,
    seatsSuffix: t.events.seatsLeft,
    cancelled: t.events.cancelled,
  };

  const [
    { count: firmeCount },
    { count: domeniiCount },
    { count: judeteCount },
    { data: stiriData },
    { data: evenimenteData },
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("judete").select("cod", { count: "exact", head: true }),
    supabase
      .from("news_articles")
      .select("slug, titlu, rezumat, imagine_url, published_at")
      .eq("status", "publicat")
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("events")
      .select("slug, titlu, imagine_url, tip, locatie, online, data_inceput, status")
      .eq("status", "publicat")
      .gte("data_inceput", new Date().toISOString())
      .order("data_inceput", { ascending: true })
      .limit(3),
  ]);

  const stiri = (stiriData as NewsCardData[]) ?? [];
  const evenimente = (evenimenteData as EventCardData[]) ?? [];

  const pasi = [
    { n: "01", icon: FileCheck2, title: t.home.step1Title, body: t.home.step1Body },
    { n: "02", icon: Users, title: t.home.step2Title, body: t.home.step2Body },
    { n: "03", icon: Handshake, title: t.home.step3Title, body: t.home.step3Body },
  ];

  const increderi = [
    { icon: ShieldCheck, text: t.home.trust1 },
    { icon: LockKeyhole, text: t.home.trust2 },
    { icon: Users, text: t.home.trust3 },
  ];

  return (
    <>
      {/* ================= HERO (trimis) ================= */}
      <section className="hero-wash relative overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 grid-registry opacity-60" />
        <div
          aria-hidden
          className="absolute -right-16 -top-20 h-80 w-80 rounded-full bg-seal/10 blur-3xl"
          style={{ animation: "float-a 10s ease-in-out infinite" }}
        />
        <div
          aria-hidden
          className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-teal/10 blur-3xl"
          style={{ animation: "float-b 12s ease-in-out infinite" }}
        />
        <style>{`
          @keyframes float-a { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-18px) rotate(6deg); } }
          @keyframes float-b { 0%,100% { transform: translateY(0); } 50% { transform: translateY(14px); } }
        `}</style>

        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-seal to-ember px-3.5 py-1.5 text-white shadow-[var(--shadow-md)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="stamp-label">{t.home.eyebrow}</span>
            </div>

            <h1 className="mt-6 max-w-xl text-5xl font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              <span className="text-gradient-seal">{t.home.titleAccent}</span>
              <br />
              {t.home.titleRest}
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
              {t.home.subtitle}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <LinkButton href="/inregistrare" variant="seal" size="lg" className="shadow-lg shadow-seal/25 hover:shadow-xl hover:shadow-seal/30">
                {t.home.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/catalog" variant="secondary" size="lg">
                <Search className="h-4 w-4" />
                {t.home.ctaSecondary}
              </LinkButton>
            </div>

            <HomeStats firme={firmeCount ?? 0} domenii={domeniiCount ?? 0} judete={judeteCount ?? 0} />
          </div>

          <div className="relative flex justify-center md:justify-end">
            <div
              aria-hidden
              className="absolute h-72 w-72 rounded-full opacity-20 blur-3xl gradient-seal sm:h-96 sm:w-96"
            />
            <div
              aria-hidden
              className="absolute h-64 w-64 rounded-full sm:h-80 sm:w-80"
              style={{
                background: "conic-gradient(from 0deg, var(--color-seal), var(--color-teal), var(--color-seal))",
                animation: "spin 40s linear infinite",
              }}
            />
            <div className="glow-seal relative flex h-56 w-56 items-center justify-center rounded-full bg-surface sm:h-72 sm:w-72">
              <BrandMark className="h-16 w-16 sm:h-20 sm:w-20" />
              <span className="absolute -bottom-3.5 rounded-full gradient-seal px-4 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-lg)]">
                {t.home.stampLabel}
              </span>
            </div>
          </div>
        </div>

        <RecentCompaniesTicker />
      </section>

      {/* ================= NAVIGARE RAPIDA ================= */}
      <section className="border-b border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <p className="stamp-label mb-3 text-ink-soft">{t.home.quickNavTitle}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { href: "/catalog", label: t.home.quickNavFirme, icon: Building2 },
              { href: "/membri", label: t.home.quickNavMembri, icon: Users },
              { href: "/oportunitati", label: t.home.quickNavOportunitati, icon: Briefcase },
              { href: "/evenimente", label: t.home.quickNavEvenimente, icon: CalendarDays },
              { href: "/stiri", label: t.home.quickNavStiri, icon: Newspaper },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="lift-on-hover flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3.5 text-sm font-semibold text-ink transition hover:border-seal/40"
              >
                <item.icon className="h-4 w-4 shrink-0 text-seal" strokeWidth={1.8} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= EVENIMENTE ================= */}
      <section className="relative mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="stamp-label text-seal">{t.home.eventsEyebrow}</p>
            <h2 className="mt-2 flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              <CalendarDays className="h-6 w-6 text-seal" strokeWidth={1.8} />
              {t.home.eventsTitle}
            </h2>
          </div>
          <Link href="/evenimente" className="shrink-0 text-sm font-semibold text-seal hover:underline">
            {t.home.eventsSeeAll}
          </Link>
        </div>

        {evenimente.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">{t.home.eventsEmpty}</p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {evenimente.map((e) => (
              <EventCard key={e.slug} event={e} labels={eventLabels} dateLocale={dateLocale} />
            ))}
          </div>
        )}
      </section>

      {/* ================= STIRI ================= */}
      <section className="relative border-y border-line bg-surface/50">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="stamp-label text-seal">{t.home.newsEyebrow}</p>
              <h2 className="mt-2 flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                <Newspaper className="h-6 w-6 text-seal" strokeWidth={1.8} />
                {t.home.newsTitle}
              </h2>
            </div>
            <Link href="/stiri" className="shrink-0 text-sm font-semibold text-seal hover:underline">
              {t.home.newsSeeAll}
            </Link>
          </div>

          {stiri.length === 0 ? (
            <p className="mt-6 text-sm text-ink-soft">{t.home.newsEmpty}</p>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {stiri.map((s) => (
                <NewsCard key={s.slug} article={s} readMoreLabel={t.news.readMore} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= CUM FUNCTIONEAZA ================= */}
      <section id="cum-functioneaza" className="relative mx-auto max-w-6xl px-5 py-24">
        <div className="max-w-xl">
          <p className="stamp-label text-seal">{t.nav.howItWorks}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t.home.howTitle}
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pasi.map((step, i) => (
            <div
              key={step.n}
              className="lift-on-hover block-base relative overflow-hidden p-7"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                aria-hidden
                className={`absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 ${STEP_TINTS[i]}`}
              />
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-[var(--shadow-md)] ${
                    i === 0 ? "gradient-seal" : i === 1 ? "bg-gradient-to-br from-teal to-teal-light" : "bg-gradient-to-br from-violet to-seal"
                  }`}
                >
                  <step.icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                </div>
                <span className="font-mono-num text-3xl font-bold text-ink/8">{step.n}</span>
              </div>
              <h3 className="relative mt-5 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= INCREDERE ================= */}
      <section className="relative overflow-hidden border-y border-line bg-navy">
        <BrandMark variant="white" className="pointer-events-none absolute -right-16 -bottom-16 h-80 w-80 opacity-[0.06] rotate-6" />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full opacity-15 blur-3xl gradient-seal"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet opacity-15 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-5 py-24">
          <div className="max-w-xl">
            <p className="stamp-label text-seal-light">{t.home.trustEyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {t.home.trustTitle}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {increderi.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/4 p-7 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-seal/40 hover:bg-white/6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-seal shadow-[var(--shadow-md)]">
                  <item.icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                </div>
                <p className="mt-5 text-sm leading-relaxed text-white/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="hero-wash relative overflow-hidden">
        <div className="relative mx-auto max-w-3xl px-5 py-24 text-center">
          <BrandMark className="mx-auto h-14 w-14 drop-shadow-[0_10px_20px_rgba(10,37,64,0.15)]" />
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t.home.ctaFinalTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-ink-soft">
            {t.home.ctaFinalBody}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <LinkButton href="/inregistrare" variant="seal" size="lg" className="shadow-lg shadow-seal/25 hover:shadow-xl hover:shadow-seal/30">
              {t.home.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
