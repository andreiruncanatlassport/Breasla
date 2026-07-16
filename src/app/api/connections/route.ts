import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const targetCompanyId = body?.target_company_id;
  if (!targetCompanyId) {
    return NextResponse.json({ error: "Firmă țintă lipsă." }, { status: 400 });
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
      { error: "Trebuie să ai o firmă verificată ca să trimiți cereri de conexiune." },
      { status: 403 }
    );
  }

  const myCompanyId = (myCompany as { id: string }).id;

  if (myCompanyId === targetCompanyId) {
    return NextResponse.json({ error: "Nu te poți conecta cu propria firmă." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("connections")
    .insert({
      requester_company_id: myCompanyId,
      target_company_id: targetCompanyId,
      mesaj: body?.mesaj ?? null,
    } as never)
    .select("id, status")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: isDuplicate ? "Ai trimis deja o cerere către această firmă." : error.message },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ data });
}
