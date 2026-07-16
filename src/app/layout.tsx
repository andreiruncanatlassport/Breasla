import type { Metadata } from "next";
import "./globals.css";
import { SettingsProvider, settingsInitScript } from "@/lib/settings/context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const metadata: Metadata = {
  title: "Breasla — Registrul antreprenorilor din România",
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
    <html lang="ro" className="h-full antialiased" suppressHydrationWarning>
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
