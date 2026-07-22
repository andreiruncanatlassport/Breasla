import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificaFirma } from "@/lib/notifications";

/** Raspunde la o oportunitate deschisa, in numele unei firme detinute de userul curent. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: opportunityId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const mesaj = String(body?.mesaj || "").trim();
  const pretEstimat = body?.pret_estimat ? Number(body.pret_estimat) : null;

  if (!mesaj) {
    return NextResponse.json({ error: "Scrie un mesaj înainte de a trimite." }, { status: 400 });
  }

  const { data: oportunitate } = await supabase
    .from("opportunities")
    .select("id, status, company_id")
    .eq("id", opportunityId)
    .maybeSingle();
  const oportunitateRow = oportunitate as { id: string; status: string; company_id: string } | null;
  if (!oportunitateRow || oportunitateRow.status !== "deschisa") {
    return NextResponse.json({ error: "Această oportunitate nu mai este deschisă." }, { status: 404 });
  }

  let companyId = body?.company_id ? String(body.company_id) : null;
  const { data: companiiData } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .eq("status", "approved");
  const companiileMele = ((companiiData as { id: string }[]) ?? []).map((c) => c.id);

  if (companiileMele.length === 0) {
    return NextResponse.json({ error: "Trebuie să ai o firmă verificată ca să răspunzi." }, { status: 403 });
  }
  if (!companyId || !companiileMele.includes(companyId)) {
    companyId = companiileMele[0];
  }
  if (companyId === oportunitateRow.company_id) {
    return NextResponse.json({ error: "Nu poți răspunde la propria oportunitate." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("opportunity_responses")
    .insert({
      opportunity_id: opportunityId,
      company_id: companyId,
      mesaj,
      pret_estimat: pretEstimat,
    } as never)
    .select("id")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: isDuplicate ? "Ai răspuns deja la această oportunitate." : error.message },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  const { data: profilMeu } = await supabase.from("profiles").select("nume_complet").eq("id", user.id).maybeSingle();
  const numeMeu = (profilMeu as { nume_complet: string } | null)?.nume_complet ?? "Un membru";

  await notificaFirma(oportunitateRow.company_id, {
    tip: "oportunitate_raspuns",
    titlu: `Răspuns nou la oportunitatea ta`,
    mesaj: `${numeMeu} a răspuns: ${mesaj.length > 100 ? `${mesaj.slice(0, 100)}...` : mesaj}`,
    link: `/oportunitati/${opportunityId}`,
  });

  return NextResponse.json({ data });
}
