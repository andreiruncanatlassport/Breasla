import { createBrowserClient } from "@supabase/ssr";

/**
 * Nota despre tipuri: nu folosim genericul Database<> aici in mod deliberat —
 * inferenta stricta de tipuri a Supabase pentru siruri "select(...)" cere fie
 * tipuri generate cu Supabase CLI dintr-o baza vie, fie o gimnastica TS
 * ampla pentru un schema scris manual. In schimb, tipam manual rezultatele
 * (vezi src/types/database.ts: Profile, Company, etc.) acolo unde le folosim.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
