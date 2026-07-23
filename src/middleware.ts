import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
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
