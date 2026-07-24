import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 a redenumit conventia "middleware.ts" -> "proxy.ts" (functia
// exportata trebuie sa se numeasca `proxy`, nu `middleware`). Comportamentul
// e identic — doar numele s-a schimbat. Vezi nextjs.org/docs/messages/middleware-to-proxy

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Rulam pe orice cale IN AFARA de:
     * - _next/static, _next/image (fisiere statice/optimizare imagini)
     * - favicon.ico, manifest, iconite
     * - fisiere cu extensie (imagini, fonturi etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
