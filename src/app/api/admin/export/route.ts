import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/** Escapare minima pentru un camp CSV. */
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const linii = [headers.join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  return "\uFEFF" + linii.join("\n"); // BOM pentru diacritice corecte in Excel
}

/**
 * GET /api/admin/export?tip=membri|firme — descarca un CSV cu toti membrii
 * sau toate firmele. Doar admin/moderator.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautentificat." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  const rol = (profile as Pick<Profile, "rol"> | null)?.rol;
  if (rol !== "admin" && rol !== "moderator") {
    return NextResponse.json({ error: "Fără drepturi." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tip = searchParams.get("tip") === "firme" ? "firme" : "membri";
  const admin = createServiceRoleClient();

  let csv: string;
  let filename: string;

  if (tip === "firme") {
    const { data } = await admin
      .from("companies")
      .select("denumire, cui, status, localitate, judet_cod, telefon_firma, email_firma, website, created_at")
      .order("created_at", { ascending: false });
    const rows = ((data as Record<string, unknown>[]) ?? []).map((c) => [
      c.denumire,
      c.cui,
      c.status,
      c.localitate,
      c.judet_cod,
      c.telefon_firma,
      c.email_firma,
      c.website,
      c.created_at,
    ]);
    csv = toCsv(
      ["Denumire", "CUI", "Status", "Localitate", "Judet", "Telefon", "Email", "Website", "Creat la"],
      rows
    );
    filename = "firme.csv";
  } else {
    const { data } = await admin
      .from("profiles")
      .select("nume_complet, email_personal, telefon_personal, titlu, firma_declarata, oras, judet_cod, rol, activ, created_at")
      .order("created_at", { ascending: false });
    const rows = ((data as Record<string, unknown>[]) ?? []).map((m) => [
      m.nume_complet,
      m.email_personal,
      m.telefon_personal,
      m.titlu,
      m.firma_declarata,
      m.oras,
      m.judet_cod,
      m.rol,
      m.activ ? "activ" : "dezactivat",
      m.created_at,
    ]);
    csv = toCsv(
      ["Nume", "Email", "Telefon", "Titlu", "Firma", "Oras", "Judet", "Rol", "Stare", "Creat la"],
      rows
    );
    filename = "membri.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
