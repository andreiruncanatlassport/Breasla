"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound, Building2 } from "lucide-react";

interface Sugestie {
  id: string;
  label: string;
  sub?: string;
  href: string;
}

/**
 * Input de cautare cu sugestii live (autocomplete) sub el. Sugestiile apar
 * discret pe masura ce tastezi si duc direct la profilul membrului/firmei —
 * fara sa forteze ceva. Enter cauta normal (submit) in lista.
 */
export function SearchWithSuggestions({
  tip,
  defaultValue = "",
  placeholder,
  onSubmitSearch,
}: {
  tip: "membri" | "firme";
  defaultValue?: string;
  placeholder?: string;
  onSubmitSearch: (q: string) => void;
}) {
  const router = useRouter();
  const [valoare, setValoare] = useState(defaultValue);
  const [sugestii, setSugestii] = useState<Sugestie[]>([]);
  const [deschis, setDeschis] = useState(false);
  const [activIndex, setActivIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = valoare.trim();
    let anulat = false;
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        if (!anulat) setSugestii([]);
        return;
      }
      try {
        const res = await fetch(`/api/sugestii?tip=${tip}&q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (!anulat) {
          setSugestii(json.data ?? []);
          setDeschis(true);
          setActivIndex(-1);
        }
      } catch {
        // ignoram — sugestiile sunt optionale
      }
    }, 180);
    return () => {
      anulat = true;
      clearTimeout(timer);
    };
  }, [valoare, tip]);

  // inchide dropdownul la click in afara
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setDeschis(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!deschis || sugestii.length === 0) {
      if (e.key === "Enter") onSubmitSearch(valoare.trim());
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivIndex((i) => Math.min(i + 1, sugestii.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activIndex >= 0 && sugestii[activIndex]) {
        router.push(sugestii[activIndex].href);
      } else {
        onSubmitSearch(valoare.trim());
        setDeschis(false);
      }
    } else if (e.key === "Escape") {
      setDeschis(false);
    }
  }

  const Icon = tip === "firme" ? Building2 : UserRound;

  return (
    <div ref={wrapRef} className="relative max-w-sm flex-1 min-w-[220px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-soft/50" />
      <input
        value={valoare}
        onChange={(e) => setValoare(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => sugestii.length > 0 && setDeschis(true)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line-strong bg-surface py-2.5 pl-9 pr-3.5 text-sm text-ink shadow-[inset_0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all duration-200 placeholder:text-ink-soft/60 focus:border-seal focus:ring-3 focus:ring-seal/12"
      />

      {deschis && sugestii.length > 0 && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-lg)]">
          {sugestii.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setActivIndex(i)}
              onClick={() => router.push(s.href)}
              className={
                "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition " +
                (i === activIndex ? "bg-seal/8" : "hover:bg-ink/3")
              }
            >
              <Icon className="h-4 w-4 shrink-0 text-ink-soft/60" strokeWidth={1.6} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{s.label}</span>
                {s.sub && <span className="block truncate text-xs text-ink-soft">{s.sub}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
