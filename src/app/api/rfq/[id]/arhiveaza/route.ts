import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rfqId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const companyId = String(body?.companyId || "");
  if (!companyId) return NextResponse.json({ error: "Firmă lipsă." }, { status: 400 });

  // RLS (owns_company) confirma ca firma imi apartine.
  const { error } = await supabase
    .from("rfq_arhivari")
    .upsert({ company_id: companyId, rfq_id: rfqId } as never, { onConflict: "company_id,rfq_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rfqId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") ?? "";
  if (!companyId) return NextResponse.json({ error: "Firmă lipsă." }, { status: 400 });

  const { error } = await supabase
    .from("rfq_arhivari")
    .delete()
    .eq("rfq_id", rfqId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { ok: true } });
}
