"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, Sun, Moon, Check } from "lucide-react";
import { useSettings, type FontChoice, type FontSize } from "@/lib/settings/context";

const FONTURI: { id: FontChoice; label_ro: string; label_en: string }[] = [
  { id: "sistem", label_ro: "Sistem", label_en: "System" },
  { id: "clasic", label_ro: "Clasic (serif)", label_en: "Classic (serif)" },
  { id: "rotunjit", label_ro: "Rotunjit", label_en: "Rounded" },
];

const MARIMI: { id: FontSize; label_ro: string; label_en: string }[] = [
  { id: "mic", label_ro: "Mic", label_en: "Small" },
  { id: "normal", label_ro: "Normal", label_en: "Normal" },
  { id: "mare", label_ro: "Mare", label_en: "Large" },
];

export function SettingsMenu() {
  const { locale, setLocale, theme, setTheme, font, setFont, fontSize, setFontSize } = useSettings();
  const [deschis, setDeschis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setDeschis(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const ro = locale === "ro";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setDeschis((v) => !v)}
        className="rounded-full p-2 text-current opacity-80 transition hover:bg-white/10 hover:opacity-100"
        aria-label={ro ? "Setări" : "Settings"}
      >
        <Settings className="h-[18px] w-[18px]" />
      </button>

      {deschis && (
        <div className="glass absolute right-0 top-full z-50 mt-2 w-72 rounded-xl p-4 text-ink shadow-xl">
          {/* Limba */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              {ro ? "Limbă" : "Language"}
            </p>
            <div className="mt-2 flex rounded-lg border border-line bg-paper p-1">
              <button
                onClick={() => setLocale("ro")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  ro ? "bg-primary text-primary-content" : "text-ink/60 hover:text-ink"
                }`}
              >
                Română
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  !ro ? "bg-primary text-primary-content" : "text-ink/60 hover:text-ink"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Tema */}
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              {ro ? "Temă" : "Theme"}
            </p>
            <div className="mt-2 flex rounded-lg border border-line bg-paper p-1">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  theme === "light" ? "bg-primary text-primary-content" : "text-ink/60 hover:text-ink"
                }`}
              >
                <Sun className="h-3.5 w-3.5" /> {ro ? "Luminos" : "Light"}
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  theme === "dark" ? "bg-primary text-primary-content" : "text-ink/60 hover:text-ink"
                }`}
              >
                <Moon className="h-3.5 w-3.5" /> {ro ? "Întunecat" : "Dark"}
              </button>
            </div>
          </div>

          {/* Font */}
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              {ro ? "Font" : "Font"}
            </p>
            <div className="mt-2 space-y-1">
              {FONTURI.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.id)}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-ink/80 transition hover:bg-ink/5"
                >
                  {ro ? f.label_ro : f.label_en}
                  {font === f.id && <Check className="h-3.5 w-3.5 text-seal" />}
                </button>
              ))}
            </div>
          </div>

          {/* Marime font */}
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              {ro ? "Mărime text" : "Text size"}
            </p>
            <div className="mt-2 flex rounded-lg border border-line bg-paper p-1">
              {MARIMI.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setFontSize(m.id)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition ${
                    fontSize === m.id ? "bg-primary text-primary-content" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {ro ? m.label_ro : m.label_en}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
