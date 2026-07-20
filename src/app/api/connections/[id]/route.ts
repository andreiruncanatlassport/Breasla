import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const actiune = body?.actiune;
  if (actiune !== "accept" && actiune !== "decline" && actiune !== "cancel") {
    return NextResponse.json({ error: "Acțiune invalidă." }, { status: 400 });
  }

  const nouStatus = actiune === "accept" ? "accepted" : "declined";

  const { data, error } = await supabase
    .from("connections")
    .update({ status: nouStatus, responded_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
