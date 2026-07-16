"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Building2 } from "lucide-react";
import { useSettings } from "@/lib/settings/context";
import { LinkButton } from "@/components/ui/Button";
import { SettingsMenu } from "@/components/SettingsMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  userEmail: string | null;
  rol: "user" | "moderator" | "admin" | null;
}

export function Header({ userEmail, rol }: HeaderProps) {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Building2 className="h-5 w-5 text-seal-light" strokeWidth={2} />
          Breasla
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link href="/catalog" className="opacity-90 hover:opacity-100">
            {t.nav.catalog}
          </Link>
          <Link href="/#cum-functioneaza" className="opacity-90 hover:opacity-100">
            {t.nav.howItWorks}
          </Link>

          {userEmail ? (
            <>
              {(rol === "admin" || rol === "moderator") && (
                <Link href="/admin" className="opacity-90 hover:opacity-100">
                  {t.nav.admin}
                </Link>
              )}
              <Link href="/dashboard" className="opacity-90 hover:opacity-100">
                {t.nav.dashboard}
              </Link>
              <NotificationBell />
              <SettingsMenu />
              <button onClick={handleLogout} className="opacity-90 hover:opacity-100">
                {t.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="opacity-90 hover:opacity-100">
                {t.nav.login}
              </Link>
              <SettingsMenu />
              <LinkButton href="/inregistrare" variant="primary" size="sm" className="!bg-seal hover:!bg-seal-light">
                {t.nav.register}
              </LinkButton>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          {userEmail && <NotificationBell />}
          <SettingsMenu />
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Meniu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/15 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm">
            <Link href="/catalog" onClick={() => setOpen(false)}>
              {t.nav.catalog}
            </Link>
            {userEmail ? (
              <>
                {(rol === "admin" || rol === "moderator") && (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    {t.nav.admin}
                  </Link>
                )}
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  {t.nav.dashboard}
                </Link>
                <button className="text-left" onClick={handleLogout}>
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  {t.nav.login}
                </Link>
                <Link href="/inregistrare" onClick={() => setOpen(false)} className="font-semibold text-seal-light">
                  {t.nav.register}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
