import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyProject, ProjectImage } from "@/types/database";

export default async function ProiectPublicPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = await params;
  const supabase = await createClient();

  const [{ data: proiectData }, { data: imaginiData }, { data: companyData }] = await Promise.all([
    supabase.from("company_projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("project_images").select("*").eq("project_id", projectId).order("ordine"),
    supabase.from("companies").select("denumire").eq("id", id).maybeSingle(),
  ]);

  if (!proiectData) notFound();
  const proiect = proiectData as CompanyProject;
  const imagini = (imaginiData as ProjectImage[]) ?? [];
  const denumireFirma = (companyData as Pick<Company, "denumire"> | null)?.denumire;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <Link href={`/firma/${id}`} className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> {denumireFirma}
      </Link>

      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">{proiect.titlu}</h1>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/55">
        {proiect.locatie && (
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {proiect.locatie}</span>
        )}
        {proiect.an && (
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {proiect.an}</span>
        )}
      </div>

      {proiect.descriere && <p className="mt-4 max-w-2xl leading-relaxed text-ink/75">{proiect.descriere}</p>}

      {proiect.cover_url && (
        <div className="relative mt-6 h-64 w-full overflow-hidden rounded-xl bg-ink/5 sm:h-96">
          <Image src={proiect.cover_url} alt={proiect.titlu} fill className="object-cover" unoptimized />
        </div>
      )}

      {imagini.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imagini.map((img) => (
            <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-ink/5">
              <Image src={img.url} alt="" fill className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
