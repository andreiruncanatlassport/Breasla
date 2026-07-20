import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const titlu = String(body?.titlu || "").trim();
  const descriere = String(body?.descriere || "").trim();
  if (!titlu || !descriere) {
    return NextResponse.json({ error: "Titlul și descrierea sunt obligatorii." }, { status: 400 });
  }

  const tip = ["proiect", "achizitie", "colaborare", "cerere_servicii"].includes(body?.tip)
    ? body.tip
    : "proiect";

  const { data: myCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (!myCompany) {
    return NextResponse.json(
      { error: "Trebuie să ai o firmă verificată ca să postezi o oportunitate." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      company_id: (myCompany as { id: string }).id,
      titlu,
      descriere,
      tip,
      category_id: body?.category_id || null,
      judet_cod: body?.judet_cod || null,
      buget_min: body?.buget_min ?? null,
      buget_max: body?.buget_max ?? null,
      termen_limita: body?.termen_limita || null,
    } as never)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
