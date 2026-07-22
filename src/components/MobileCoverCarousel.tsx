"use client";

import { useEffect, useRef } from "react";

/**
 * Carusel orizontal cu efect "coverflow", DOAR pentru mobil — cardul din
 * centru e clar (focus), cele din stânga/dreapta sunt mai mici si usor
 * blurate, in functie de cat de departe sunt de centru. Swipe-ul e scroll
 * nativ (scroll-snap), nu un drag custom — mai fluid si mai predictibil pe
 * telefon decat o reimplementare manuala a gesturilor.
 *
 * Folosire: se randeaza in PARALEL cu grid-ul normal de desktop, ascuns unul
 * fata de celalalt prin clase Tailwind responsive (`hidden sm:grid` /
 * `sm:hidden`) — vezi utilizarea in src/app/page.tsx. Asta evita complet
 * problemele de hidratare SSR (nu depindem de JS ca sa stim latimea ecranului).
 */
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

      Array.from(container.children).forEach((copil) => {
        const el = copil as HTMLElement;
        const dreptunghi = el.getBoundingClientRect();
        const centruEl = dreptunghi.left + dreptunghi.width / 2;
        const distanta = Math.abs(centruEl - centruContainer);
        const apropiere = Math.max(0, 1 - distanta / raza); // 1 = in centru, 0 = la margine

        const scala = 0.82 + 0.18 * apropiere;
        const opacitate = 0.4 + 0.6 * apropiere;
        const blurPx = (1 - apropiere) * 4;

        el.style.transform = `scale(${scala.toFixed(3)})`;
        el.style.opacity = opacitate.toFixed(3);
        el.style.filter = blurPx > 0.15 ? `blur(${blurPx.toFixed(2)}px)` : "none";
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
      className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[18%] pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="w-[64%] shrink-0 snap-center transition-[transform,filter,opacity] duration-150 ease-out"
        >
          {item}
        </div>
      ))}
    </div>
  );
}
