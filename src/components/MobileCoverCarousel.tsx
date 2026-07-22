"use client";

import { useEffect, useRef } from "react";

/**
 * Carusel orizontal pentru mobil — cardul din centru e mai LAT (focus), cele
 * din stânga/dreapta sunt mai înguste, dar la fel de clare (fără blur — se
 * citeau greu cu blur). Swipe-ul e scroll nativ (scroll-snap), nu un drag
 * custom — mai fluid si mai predictibil pe telefon.
 *
 * Cazul de margine: primul si ultimul card trebuie sa poata ajunge "in focus"
 * chiar daca geometria de scroll nu-i aduce niciodata perfect in centrul
 * ecranului (padding-ul lateral e simetric, dar la capete nu mai exista vecin
 * de partea aia) — de-aia verificam explicit scrollLeft si fortam focus pe
 * primul/ultimul card cand ajungi la capat, indiferent de calculul geometric.
 *
 * Folosire: se randeaza in PARALEL cu grid-ul normal de desktop, ascuns unul
 * fata de celalalt prin clase Tailwind responsive (`hidden sm:grid` /
 * `sm:hidden`) — vezi utilizarea in src/app/page.tsx.
 */

const LATIME_FOCUS = 72; // % din latimea containerului, cand cardul e in centru
const LATIME_DEPARTE = 48; // % cand cardul e cat mai departe de centru
const PADDING_LATERAL = (100 - LATIME_FOCUS) / 2; // simetric, ca sa poata centra primul/ultimul card

export function MobileCoverCarousel({ items }: { items: React.ReactNode[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let cadruProgramat = 0;

    function actualizeazaFocus() {
      cadruProgramat = 0;
      if (!container) return;

      const dreptunghiContainer = container.getBoundingClientRect();
      const centruContainer = dreptunghiContainer.left + dreptunghiContainer.width / 2;
      const raza = dreptunghiContainer.width / 2 || 1;

      const laInceput = container.scrollLeft <= 2;
      const laSfarsit = container.scrollLeft >= container.scrollWidth - container.clientWidth - 2;
      const copii = Array.from(container.children);

      copii.forEach((copil, index) => {
        const el = copil as HTMLElement;

        let apropiere: number;
        if (index === 0 && laInceput) {
          apropiere = 1;
        } else if (index === copii.length - 1 && laSfarsit) {
          apropiere = 1;
        } else {
          const dreptunghi = el.getBoundingClientRect();
          const centruEl = dreptunghi.left + dreptunghi.width / 2;
          const distanta = Math.abs(centruEl - centruContainer);
          apropiere = Math.max(0, 1 - distanta / raza);
        }

        const latime = LATIME_DEPARTE + (LATIME_FOCUS - LATIME_DEPARTE) * apropiere;
        const opacitate = 0.72 + 0.28 * apropiere;

        el.style.width = `${latime.toFixed(2)}%`;
        el.style.opacity = opacitate.toFixed(3);
      });
    }

    function laScroll() {
      if (cadruProgramat) return;
      cadruProgramat = requestAnimationFrame(actualizeazaFocus);
    }

    // calculul initial + un recalcul dupa ce se aseaza layout-ul/fonturile
    actualizeazaFocus();
    const timeout = window.setTimeout(actualizeazaFocus, 80);

    container.addEventListener("scroll", laScroll, { passive: true });
    window.addEventListener("resize", laScroll);
    return () => {
      container.removeEventListener("scroll", laScroll);
      window.removeEventListener("resize", laScroll);
      if (cadruProgramat) cancelAnimationFrame(cadruProgramat);
      window.clearTimeout(timeout);
    };
  }, [items.length]);

  return (
    <div
      ref={scrollRef}
      className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ paddingLeft: `${PADDING_LATERAL}%`, paddingRight: `${PADDING_LATERAL}%` }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="shrink-0 snap-center transition-[width,opacity] duration-200 ease-out"
          style={{ width: `${LATIME_FOCUS}%` }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
