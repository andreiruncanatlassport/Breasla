"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { translations, type Locale } from "@/lib/i18n/translations";

export type Theme = "light" | "dark";
export type FontChoice = "sistem" | "clasic" | "rotunjit";
export type FontSize = "mic" | "normal" | "mare";

interface StoredSettings {
  locale: Locale;
  theme: Theme;
  font: FontChoice;
  fontSize: FontSize;
}

interface SettingsContextValue extends StoredSettings {
  t: (typeof translations)["ro"];
  setLocale: (l: Locale) => void;
  setTheme: (t: Theme) => void;
  setFont: (f: FontChoice) => void;
  setFontSize: (s: FontSize) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SETTINGS_STORAGE_KEY = "rac-settings";

const DEFAULT_SETTINGS: StoredSettings = {
  locale: "ro",
  theme: "light",
  font: "sistem",
  fontSize: "normal",
};

/**
 * Script care ruleaza INAINTE de hidratare (vezi layout.tsx) ca sa evite un
 * "flash" al temei/fontului gresit la incarcarea paginii.
 */
export const settingsInitScript = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)});
    var s = raw ? JSON.parse(raw) : {};
    var theme = s.theme || "light";
    var font = s.font || "sistem";
    var fontSize = s.fontSize || "normal";
    var root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    root.classList.add("font-" + font);
    root.classList.add("text-" + fontSize);
  } catch (e) {}
})();
`;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [gata, setGata] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<StoredSettings>) : {};
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings((prev) => ({
        ...prev,
        theme: parsed.theme ?? "light",
        locale: parsed.locale ?? prev.locale,
        font: parsed.font ?? prev.font,
        fontSize: parsed.fontSize ?? prev.fontSize,
      }));
    } catch {
      // ignoram — ramanem pe setarile implicite
    } finally {
      setGata(true);
    }
  }, []);

  useEffect(() => {
    if (!gata) return;
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.classList.remove("font-sistem", "font-clasic", "font-rotunjit");
    root.classList.add(`font-${settings.font}`);
    root.classList.remove("text-mic", "text-normal", "text-mare");
    root.classList.add(`text-${settings.fontSize}`);
    root.lang = settings.locale;
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      // cookie separat, doar pentru locale — citit de componentele de server
      // (paginile randate pe server nu au acces la localStorage).
      document.cookie = `rac-locale=${settings.locale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // localStorage indisponibil (mod privat etc.) — comutarea tot functioneaza in sesiunea curenta
    }
  }, [settings, gata]);

  function update(patch: Partial<StoredSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  const value: SettingsContextValue = {
    ...settings,
    t: translations[settings.locale],
    setLocale: (locale) => {
      update({ locale });
      // paginile randate pe server (majoritatea site-ului) citesc limba
      // dintr-un cookie — refresh() le re-randeaza cu noua limba, fara
      // reload complet si fara sa pierdem starea componentelor client.
      router.refresh();
    },
    setTheme: (theme) => update({ theme }),
    setFont: (font) => update({ font }),
    setFontSize: (fontSize) => update({ fontSize }),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
