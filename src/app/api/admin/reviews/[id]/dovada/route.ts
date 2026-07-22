import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Review } from "@/types/database";

export async function GET(
  _request: Request,
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

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") {
    return NextResponse.json({ error: "Nu ai drepturi de administrare." }, { status: 403 });
  }

  const { data: review } = await supabase.from("reviews").select("dovada_url").eq("id", id).single();
  const path = (review as Pick<Review, "dovada_url"> | null)?.dovada_url;
  if (!path) {
    return NextResponse.json({ error: "Nicio dovadă atașată." }, { status: 404 });
  }

  const { data, error } = await supabase.storage.from("review-proofs").createSignedUrl(path, 300);
  if (error || !data) {
    return NextResponse.json({ error: "Nu am putut genera link-ul." }, { status: 500 });
  }

  return NextResponse.json({ data: { url: data.signedUrl } });
}
