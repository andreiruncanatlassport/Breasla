import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_DESTINATARI = 10;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { titlu, descriere, category_id, judet_cod, buget_min, buget_max, termen_limita, destinatari } =
    body ?? {};

  if (!titlu?.trim() || !descriere?.trim()) {
    return NextResponse.json({ error: "Titlul și descrierea sunt obligatorii." }, { status: 400 });
  }

  const listaDestinatari: string[] = Array.isArray(destinatari) ? destinatari : [];
  if (listaDestinatari.length === 0) {
    return NextResponse.json({ error: "Alege cel puțin o firmă căreia să trimiți cererea." }, { status: 400 });
  }
  // Limita e anti-spam: o cerere trimisa la 200 de firme ar transforma
  // platforma intr-un canal de mesaje nesolicitate.
  if (listaDestinatari.length > MAX_DESTINATARI) {
    return NextResponse.json(
      { error: `Poți trimite o cerere către maximum ${MAX_DESTINATARI} firme deodată.` },
      { status: 400 }
    );
  }

  const { data: myCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (!myCompany) {
    return NextResponse.json(
      { error: "Trebuie să ai o firmă verificată ca să trimiți cereri de ofertă." },
      { status: 403 }
    );
  }

  const myCompanyId = (myCompany as { id: string }).id;

  const { data: rfq, error } = await supabase
    .from("rfqs")
    .insert({
      requester_company_id: myCompanyId,
      titlu: titlu.trim(),
      descriere: descriere.trim(),
      category_id: category_id || null,
      judet_cod: judet_cod || null,
      buget_min: buget_min ?? null,
      buget_max: buget_max ?? null,
      termen_limita: termen_limita || null,
    } as never)
    .select("id")
    .single();

  if (error || !rfq) {
    return NextResponse.json({ error: error?.message ?? "Nu am putut salva cererea." }, { status: 500 });
  }

  const rfqId = (rfq as { id: string }).id;

  const { error: recipientsError } = await supabase.from("rfq_recipients").insert(
    listaDestinatari
      .filter((cid) => cid !== myCompanyId)
      .map((cid) => ({ rfq_id: rfqId, company_id: cid })) as never
  );

  if (recipientsError) {
    return NextResponse.json({ error: recipientsError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id: rfqId } });
}
