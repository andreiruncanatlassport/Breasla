import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mesajEroareSigur } from "@/lib/api-errors";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const { error } = await supabase.from("category_caen_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: mesajEroareSigur(error, "DELETE src/app/api/admin/caen/[id]/route.ts") }, { status: 500 });

  return NextResponse.json({ data: { deleted: true } });
}
