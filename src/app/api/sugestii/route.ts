import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sugestii?q=...&tip=membri|firme
 * Sugestii discrete de autocomplete (nume membri sau firme) pentru bara de
 * cautare. Returneaza cel mult 5 potriviri — folosit ca "ghost"/dropdown sub
 * input, fara sa forteze ceva pe utilizator.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tip = searchParams.get("tip") === "firme" ? "firme" : "membri";
  if (q.length < 2) return NextResponse.json({ data: [] });

  const supabase = await createClient();
  const safe = q.replace(/[,()]/g, " ");

  if (tip === "firme") {
    const { data } = await supabase
      .from("companies")
      .select("id, denumire, slug")
      .eq("status", "approved")
      .ilike("denumire", `%${safe}%`)
      .limit(5);
    return NextResponse.json({
      data: ((data as { id: string; denumire: string; slug: string | null }[]) ?? []).map((c) => ({
        id: c.id,
        label: c.denumire,
        href: `/firma/${c.slug ?? c.id}`,
      })),
    });
  }

  const { data } = await supabase
    .from("member_directory")
    .select("id, nume_complet, titlu, company_denumire, firma_declarata")
    .or(`nume_complet.ilike.%${safe}%,company_denumire.ilike.%${safe}%,firma_declarata.ilike.%${safe}%`)
    .limit(5);

  return NextResponse.json({
    data: (
      (data as {
        id: string;
        nume_complet: string;
        titlu: string | null;
        company_denumire: string | null;
        firma_declarata: string | null;
      }[]) ?? []
    ).map((m) => ({
      id: m.id,
      label: m.nume_complet,
      sub: [m.titlu, m.company_denumire ?? m.firma_declarata].filter(Boolean).join(" · "),
      href: `/membri/${m.id}`,
    })),
  });
}
