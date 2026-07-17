import type { Metadata } from "next";
import { Space_Grotesk, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-space-grotesk", weight: ["500", "600", "700"] });
const workSans = Work_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-work-sans", weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", weight: ["500", "600"] });
import { SettingsProvider, settingsInitScript } from "@/lib/settings/context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const metadata: Metadata = {
  title: "Breasla.ro — Registrul antreprenorilor din România",
  description:
    "Catalog verificat prin ANAF cu firme din România, organizat pe domenii și zone, pentru a găsi rapid colaboratori și subcontractanți de încredere.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rol: "user" | "moderator" | "admin" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();
    rol = (profile as Pick<Profile, "rol"> | null)?.rol ?? "user";
  }

  return (
    <html lang="ro" className={`h-full antialiased ${spaceGrotesk.variable} ${workSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <SettingsProvider>
          <Header userEmail={user?.email ?? null} rol={rol} />
          <main className="flex-1">{children}</main>
          <Footer />
        </SettingsProvider>
      </body>
    </html>
  );
}
