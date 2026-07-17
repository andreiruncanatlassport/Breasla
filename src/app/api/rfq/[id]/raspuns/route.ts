import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rfqId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const mesaj = String(body?.mesaj || "").trim();
  if (!mesaj) {
    return NextResponse.json({ error: "Scrie un mesaj." }, { status: 400 });
  }

  const { data: myCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (!myCompany) {
    return NextResponse.json({ error: "Trebuie să ai o firmă verificată." }, { status: 403 });
  }

  // RLS verifica oricum ca firma e pe lista de destinatari (vezi politica
  // "destinatarul poate raspunde"), deci nu dublam verificarea aici.
  const { data, error } = await supabase
    .from("rfq_responses")
    .insert({
      rfq_id: rfqId,
      company_id: (myCompany as { id: string }).id,
      mesaj,
      pret_estimat: body?.pret_estimat ?? null,
    } as never)
    .select("id")
    .single();

  if (error) {
    const duplicat = error.code === "23505";
    return NextResponse.json(
      { error: duplicat ? "Ai răspuns deja la această cerere." : error.message },
      { status: duplicat ? 409 : 500 }
    );
  }

  return NextResponse.json({ data });
}
