import { cookies } from "next/headers";
import { translations, type Locale } from "@/lib/i18n/translations";

/**
 * Limba pentru randare pe server — citită din cookie-ul `rac-locale`
 * (scris de SettingsProvider la fiecare schimbare de limbă din meniu).
 * Componentele client folosesc `useSettings().t` direct; componentele de
 * server (majoritatea paginilor cu date din Supabase) folosesc acest helper.
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get("rac-locale")?.value;
  return raw === "en" ? "en" : "ro";
}

/** Returnează atât limba curentă, cât și dicționarul deja selectat pentru ea. */
export async function getT() {
  const locale = await getServerLocale();
  return { locale, t: translations[locale] };
}
