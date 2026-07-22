import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MessagesShell } from "@/components/MessagesShell";

export const metadata = { title: "Mesaje — ACDR" };

export default async function MesajeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-0 py-0 sm:px-5 sm:py-8">
      <MessagesShell>{children}</MessagesShell>
    </div>
  );
}
