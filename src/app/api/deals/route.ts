import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificaFirma } from "@/lib/notifications";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { titlu, company_b_id, rfq_id } = body ?? {};

  if (!titlu?.trim() || !company_b_id) {
    return NextResponse.json({ error: "Date incomplete." }, { status: 400 });
  }

  const { data: myCompany } = await supabase
    .from("companies")
    .select("id, denumire")
    .eq("owner_id", user.id)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (!myCompany) {
    return NextResponse.json(
      { error: "Trebuie să ai o firmă verificată ca să pornești o înțelegere." },
      { status: 403 }
    );
  }

  const firmaMea = myCompany as { id: string; denumire: string };

  if (firmaMea.id === company_b_id) {
    return NextResponse.json({ error: "Nu poți porni o înțelegere cu propria firmă." }, { status: 400 });
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      titlu: titlu.trim(),
      company_a_id: firmaMea.id,
      company_b_id,
      rfq_id: rfq_id || null,
    } as never)
    .select("id")
    .single();

  if (error || !deal) {
    return NextResponse.json({ error: error?.message ?? "Nu am putut crea înțelegerea." }, { status: 500 });
  }

  const dealId = (deal as { id: string }).id;

  await notificaFirma(company_b_id, {
    tip: "deal_propunere",
    titlu: `${firmaMea.denumire} a deschis o înțelegere`,
    mesaj: `Subiect: ${titlu.trim()}. Puteți discuta termenii și ajunge la o formă finală.`,
    link: `/dashboard/intelegeri/${dealId}`,
  });

  return NextResponse.json({ data: { id: dealId } });
}
