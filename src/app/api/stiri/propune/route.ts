import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

/**
 * POST /api/stiri/propune — un membru autentificat propune o stire.
 *
 * Propunerea intra cu status='propunere', vizibila DOAR in panoul de admin
 * (politica de SELECT publica arata numai status='publicat'). Adminul o
 * gaseste in /admin/stiri, o poate edita si apoi publica oficial.
 *
 * Folosim clientul de service-role pentru insert (nu clientul normal, supus
 * RLS) ca sa fim siguri, indiferent de ce trimite clientul in request, ca
 * status si autor_id sunt FIXATE de server — un membru nu poate seta singur
 * status='publicat' pe nicio cale.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const titlu = String(body?.titlu || "").trim();
  const continut = String(body?.continut || "").trim();
  if (!titlu || !continut) {
    return NextResponse.json({ error: "Titlul și conținutul sunt obligatorii." }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("news_articles")
    .insert({
      autor_id: user.id,
      titlu: titlu.slice(0, 200),
      rezumat: body?.rezumat ? String(body.rezumat).trim().slice(0, 280) : null,
      continut,
      imagine_url: body?.imagine_url || null,
      status: "propunere",
      published_at: null,
    } as never);

  if (error) {
    return NextResponse.json(
      { error: mesajEroareSigur(error, "POST /api/stiri/propune") },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { trimis: true } });
}
