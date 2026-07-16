"use client";

import { useSettings } from "@/lib/settings/context";
import { LinkButton } from "@/components/ui/Button";
import { VerifiedStamp } from "@/components/ui/VerifiedStamp";
import { Card } from "@/components/ui/Card";
import { RecentCompaniesTicker } from "@/components/RecentCompaniesTicker";
import { ArrowRight, ShieldCheck, Users, LockKeyhole } from "lucide-react";

export default function HomePage() {
  const { t } = useSettings();

  return (
    <>
      {/* HERO */}
      <section className="paper-texture relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full opacity-20 blur-3xl gradient-seal"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-28">
          <div>
            <p className="font-mono-num text-xs font-medium uppercase tracking-[0.18em] text-seal">
              {t.home.eyebrow} · Dosar Nr. 000001
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
              {t.home.title}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/70">
              {t.home.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/inregistrare" size="lg" className="!bg-seal hover:!bg-seal-light">
                {t.home.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/catalog" variant="secondary" size="lg">
                {t.home.ctaSecondary}
              </LinkButton>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="glow-seal glass relative flex h-56 w-56 items-center justify-center rounded-full sm:h-72 sm:w-72">
              <VerifiedStamp size="lg" />
              <span className="absolute -bottom-3 rounded-full bg-navy px-3 py-1 text-xs font-medium text-white">
                {t.home.stampLabel}
              </span>
            </div>
          </div>
        </div>

        <RecentCompaniesTicker />
      </section>

      {/* CUM FUNCTIONEAZA */}
      <section id="cum-functioneaza" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{t.home.howTitle}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", title: t.home.step1Title, body: t.home.step1Body },
            { n: "02", title: t.home.step2Title, body: t.home.step2Body },
            { n: "03", title: t.home.step3Title, body: t.home.step3Body },
          ].map((step) => (
            <Card key={step.n} className="lift-on-hover relative">
              <span className="font-mono-num text-xs font-semibold text-seal">{step.n}</span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* INCREDERE */}
      <section className="border-t border-line bg-navy text-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-lg text-2xl font-semibold sm:text-3xl">{t.home.trustTitle}</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="flex gap-4">
              <ShieldCheck className="h-6 w-6 shrink-0 text-seal-light" />
              <p className="text-sm leading-relaxed text-white/80">{t.home.trust1}</p>
            </div>
            <div className="flex gap-4">
              <LockKeyhole className="h-6 w-6 shrink-0 text-seal-light" />
              <p className="text-sm leading-relaxed text-white/80">{t.home.trust2}</p>
            </div>
            <div className="flex gap-4">
              <Users className="h-6 w-6 shrink-0 text-seal-light" />
              <p className="text-sm leading-relaxed text-white/80">{t.home.trust3}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{t.home.ctaPrimary}</h2>
        <div className="mt-6">
          <LinkButton href="/inregistrare" size="lg" className="!bg-seal hover:!bg-seal-light">
            {t.home.ctaPrimary}
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </section>
    </>
  );
}
