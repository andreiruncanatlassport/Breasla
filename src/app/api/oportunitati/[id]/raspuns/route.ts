import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificaFirma } from "@/lib/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: opportunityId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const mesaj = String(body?.mesaj || "").trim();
  if (!mesaj) return NextResponse.json({ error: "Scrie un mesaj pentru firma care a postat." }, { status: 400 });

  const { data: myCompany } = await supabase
    .from("companies")
    .select("id, denumire")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (!myCompany) {
    return NextResponse.json(
      { error: "Trebuie să ai o firmă verificată ca să răspunzi la o oportunitate." },
      { status: 403 }
    );
  }

  const firma = myCompany as { id: string; denumire: string };

  const { data: oportunitate } = await supabase
    .from("opportunities")
    .select("id, company_id, titlu, status")
    .eq("id", opportunityId)
    .maybeSingle();

  const oport = oportunitate as { id: string; company_id: string; titlu: string; status: string } | null;
  if (!oport || oport.status !== "deschisa") {
    return NextResponse.json({ error: "Această oportunitate nu mai este deschisă." }, { status: 404 });
  }
  if (oport.company_id === firma.id) {
    return NextResponse.json({ error: "Nu poți răspunde la propria oportunitate." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("opportunity_responses")
    .insert({
      opportunity_id: opportunityId,
      company_id: firma.id,
      mesaj,
      pret_estimat: body?.pret_estimat ?? null,
    } as never)
    .select("id, created_at")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: isDuplicate ? "Ai răspuns deja la această oportunitate." : error.message },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  await notificaFirma(oport.company_id, {
    tip: "oportunitate_raspuns",
    titlu: `${firma.denumire} a răspuns la „${oport.titlu}”`,
    mesaj: mesaj.length > 120 ? `${mesaj.slice(0, 120)}...` : mesaj,
    link: `/oportunitati/${opportunityId}`,
  });

  return NextResponse.json({ data });
}
