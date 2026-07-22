"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Carusel pentru mobil cu UN SINGUR card pe ecran deodata — swipe intre ele.
 *
 * Deliberat simplu, ca sa nu se mai "blocheze": alunecarea insasi e 100%
 * scroll nativ al browserului (scroll-snap), fara nicio bucla JS care
 * calculeaza sau schimba stiluri la fiecare cadru de scroll. Singurul JS activ
 * e un IntersectionObserver — foarte ieftin, browserul il declanseaza doar
 * cand un card trece un prag de vizibilitate, NU la fiecare pixel de scroll —
 * folosit doar ca sa stim ce buliuta sa aprindem dedesubt, nu ca sa animam
 * cardurile. Asta elimina complet riscul de blocaj/lag intalnit cu varianta
 * anterioara (care muta latimea fiecarui card in timp real, la fiecare frame
 * de scroll, fortand recalcul de layout continuu).
 *
 * Folosire: se randeaza in PARALEL cu grid-ul normal de desktop, ascuns unul
 * fata de celalalt prin clase Tailwind responsive (`hidden sm:grid` /
 * `sm:hidden`) — vezi utilizarea in src/app/page.tsx.
 */
export function MobileSlideCarousel({ items }: { items: React.ReactNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activ, setActiv] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cardurile = Array.from(container.children) as HTMLElement[];
    const raportPeIndex = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.index);
          raportPeIndex.set(index, entry.intersectionRatio);
        });
        let indexCelMaiVizibil = 0;
        let raportMaxim = -1;
        raportPeIndex.forEach((raport, index) => {
          if (raport > raportMaxim) {
            raportMaxim = raport;
            indexCelMaiVizibil = index;
          }
        });
        setActiv(indexCelMaiVizibil);
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    cardurile.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [items.length]);

  function mergiLa(index: number) {
    const tinta = containerRef.current?.children[index] as HTMLElement | undefined;
    tinta?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div key={i} data-index={i} className="w-full shrink-0 snap-center">
            {item}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => mergiLa(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activ ? "w-5 bg-seal" : "w-1.5 bg-ink/15"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
