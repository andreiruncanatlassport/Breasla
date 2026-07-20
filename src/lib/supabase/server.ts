import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pentru Server Components / Route Handlers.
 * Respecta sesiunea (cookie-urile) userului curent -> RLS se aplica normal.
 * (Vezi client.ts pentru nota despre de ce nu folosim genericul Database<>.)
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // apelat dintr-un Server Component -> ignorat, middleware-ul reimprospateaza sesiunea
          }
        },
      },
    }
  );
}

/**
 * Client "admin" cu service_role key -> ocoleste RLS complet.
 * Foloseste-l DOAR in Route Handlers pentru operatii de sistem
 * (ex: sincronizare ANAF), NICIODATA in cod expus catre browser.
 */
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // service role client nu are nevoie de cookie-uri
        },
      },
    }
  );
}
