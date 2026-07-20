import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const companyId = String(body?.companyId || "");
  if (!companyId) return NextResponse.json({ error: "Firmă lipsă." }, { status: 400 });

  const { error } = await supabase
    .from("deal_arhivari")
    .upsert({ company_id: companyId, deal_id: dealId } as never, { onConflict: "company_id,deal_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") ?? "";
  if (!companyId) return NextResponse.json({ error: "Firmă lipsă." }, { status: 400 });

  const { error } = await supabase
    .from("deal_arhivari")
    .delete()
    .eq("deal_id", dealId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}
