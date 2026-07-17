"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings/context";
import { LinkButton } from "@/components/ui/Button";
import { BreaslaMark } from "@/components/ui/BreaslaMark";
import { RecentCompaniesTicker } from "@/components/RecentCompaniesTicker";
import { ArrowRight, ShieldCheck, Users, LockKeyhole, Search, FileCheck2, Handshake } from "lucide-react";

const STEP_TINTS = ["bg-seal", "bg-teal", "bg-navy"];
const STATS_TARGET = { firme: 2480, domenii: 61, judete: 42 };

function useCountUp(target: number, durationMs = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export default function HomePage() {
  const { t } = useSettings();
  const firme = useCountUp(STATS_TARGET.firme);
  const domenii = useCountUp(STATS_TARGET.domenii);
  const judete = useCountUp(STATS_TARGET.judete);

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-white via-[#fdf1e8] to-[#e9f6f6]">
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

        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-28">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-seal to-ember px-3.5 py-1.5 text-white shadow-[var(--shadow-md)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="stamp-label">{t.home.eyebrow}</span>
            </div>

            <h1 className="mt-6 max-w-xl text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Un singur loc unde <span className="text-gradient-seal">antreprenorii</span> din
              România se găsesc unii pe alții.
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

            <div className="mt-12 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white bg-white/70 px-5 py-3.5 shadow-[var(--shadow-md)] backdrop-blur-sm">
                <p className="font-mono-num bg-gradient-to-br from-ink to-navy bg-clip-text text-2xl font-bold text-transparent">
                  {firme.toLocaleString("ro-RO")}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">firme verificate</p>
              </div>
              <div className="rounded-2xl border border-white bg-white/70 px-5 py-3.5 shadow-[var(--shadow-md)] backdrop-blur-sm">
                <p className="font-mono-num text-2xl font-bold text-seal">{domenii}</p>
                <p className="mt-0.5 text-xs text-ink-soft">domenii</p>
              </div>
              <div className="rounded-2xl border border-white bg-white/70 px-5 py-3.5 shadow-[var(--shadow-md)] backdrop-blur-sm">
                <p className="font-mono-num text-2xl font-bold text-teal">{judete}</p>
                <p className="mt-0.5 text-xs text-ink-soft">județe</p>
              </div>
            </div>
          </div>

          {/* Sigiliul — piesa vizuala centrala */}
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
              <BreaslaMark className="h-16 w-16 sm:h-20 sm:w-20" />
              <span className="absolute -bottom-3.5 rounded-full gradient-seal px-4 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-lg)]">
                {t.home.stampLabel}
              </span>
            </div>
            <div className="absolute -right-4 top-6 flex items-center gap-1.5 rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-white shadow-[var(--shadow-lg)]">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-light" /> Recenzii verificate
            </div>
          </div>
        </div>

        <RecentCompaniesTicker />
      </section>

      {/* ================= CUM FUNCTIONEAZA ================= */}
      <section id="cum-functioneaza" className="relative mx-auto max-w-6xl px-5 py-24">
        <div className="max-w-xl">
          <p className="stamp-label text-seal">Procesul</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t.home.howTitle}
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", icon: FileCheck2, title: t.home.step1Title, body: t.home.step1Body },
            { n: "02", icon: Users, title: t.home.step2Title, body: t.home.step2Body },
            { n: "03", icon: Handshake, title: t.home.step3Title, body: t.home.step3Body },
          ].map((step, i) => (
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
                    i === 0 ? "gradient-seal" : i === 1 ? "bg-gradient-to-br from-teal to-teal-light" : "bg-gradient-to-br from-navy to-[#123a5e]"
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
        <BreaslaMark variant="white" className="pointer-events-none absolute -right-16 -bottom-16 h-80 w-80 opacity-[0.06] rotate-6" />
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
            <p className="stamp-label text-seal-light">Diferența</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {t.home.trustTitle}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: ShieldCheck, text: t.home.trust1 },
              { icon: LockKeyhole, text: t.home.trust2 },
              { icon: Users, text: t.home.trust3 },
            ].map((item, i) => (
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
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#fdf1e8] to-[#e9f6f6]">
        <div className="relative mx-auto max-w-3xl px-5 py-24 text-center">
          <BreaslaMark className="mx-auto h-14 w-14 drop-shadow-[0_10px_20px_rgba(10,37,64,0.15)]" />
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Gata să-ți găsești următorul colaborator?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-ink-soft">
            Înregistrarea durează câteva minute. Datele firmei se preiau automat de la ANAF.
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
