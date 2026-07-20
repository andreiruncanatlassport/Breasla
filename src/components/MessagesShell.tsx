"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ConversationList } from "@/components/ConversationList";
import { useSettings } from "@/lib/settings/context";

export function MessagesShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useSettings();
  const peLista = pathname === "/mesaje";

  return (
    <div className="h-[75vh] min-h-[480px] overflow-hidden border border-line sm:rounded-2xl">
      <div className="flex h-full">
        <aside
          className={clsx(
            "w-full shrink-0 overflow-y-auto border-line md:block md:w-80 md:border-r",
            peLista ? "block" : "hidden"
          )}
        >
          <div className="border-b border-line px-4 py-3.5">
            <p className="stamp-label text-ink-soft">{t.messages.title}</p>
          </div>
          <ConversationList />
        </aside>
        <main className={clsx("flex-1 overflow-hidden", peLista ? "hidden md:block" : "block")}>{children}</main>
      </div>
    </div>
  );
}
