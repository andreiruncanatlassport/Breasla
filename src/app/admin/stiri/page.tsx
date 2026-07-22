import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import type { Profile, NewsArticle } from "@/types/database";

export default async function AdminStiriPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") redirect("/dashboard");

  const { data } = await supabase.from("news_articles").select("*").order("created_at", { ascending: false });
  const stiri = ((data as NewsArticle[]) ?? []).sort(
    (a, b) => Number(b.status === "propunere") - Number(a.status === "propunere")
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="stamp-label text-seal">Administrare</p>
          <h1 className="mt-1.5 flex items-center gap-2.5 text-3xl font-semibold tracking-tight text-ink">
            <Newspaper className="h-6 w-6 text-seal" /> Știri
          </h1>
        </div>
        <LinkButton href="/admin/stiri/noua" variant="seal" size="sm">
          <Plus className="h-4 w-4" /> Știre nouă
        </LinkButton>
      </div>

      <div className="mt-8 space-y-3">
        {stiri.length === 0 && <p className="text-sm text-ink-soft">Nicio știre încă.</p>}
        {stiri.map((s) => (
          <Link key={s.id} href={`/admin/stiri/${s.id}`}>
            <Card className="lift-on-hover flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{s.titlu}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {new Date(s.created_at).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <Badge tone={s.status === "publicat" ? "success" : s.status === "propunere" ? "warning" : "neutral"}>
                {s.status === "publicat" ? "Publicat" : s.status === "propunere" ? "Propunere de membru" : "Ciornă"}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
