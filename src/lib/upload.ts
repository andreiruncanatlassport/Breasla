import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_MB = 5;
const MAX_DOC_MB = 10;

function extensieDin(fisier: File): string {
  const parti = fisier.name.split(".");
  return parti.length > 1 ? parti[parti.length - 1].toLowerCase() : "bin";
}

export interface RezultatUpload {
  path: string;
  publicUrl: string | null;
}

/**
 * Incarca o imagine (avatar/banner/poza de proiect) in bucket-ul public
 * `company-media`, sub folderul firmei — necesar pentru ca politicile RLS de
 * pe storage.objects sa recunoasca proprietarul.
 */
export async function incarcaImagineFirma(
  companyId: string,
  subfolder: string,
  fisier: File
): Promise<RezultatUpload> {
  if (fisier.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error(`Imaginea e prea mare (max ${MAX_IMAGE_MB}MB).`);
  }
  if (!fisier.type.startsWith("image/")) {
    throw new Error("Fișierul trebuie să fie o imagine.");
  }

  const supabase = createClient();
  const path = `${companyId}/${subfolder}/${Date.now()}.${extensieDin(fisier)}`;

  const { error } = await supabase.storage.from("company-media").upload(path, fisier, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("company-media").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/**
 * Incarca o dovada de colaborare (contract etc.) in bucket-ul PRIVAT
 * `review-proofs`, sub folderul firmei care lasă recenzia.
 */
export async function incarcaDovadaRecenzie(
  reviewerCompanyId: string,
  fisier: File
): Promise<RezultatUpload> {
  if (fisier.size > MAX_DOC_MB * 1024 * 1024) {
    throw new Error(`Fișierul e prea mare (max ${MAX_DOC_MB}MB).`);
  }

  const supabase = createClient();
  const path = `${reviewerCompanyId}/${Date.now()}.${extensieDin(fisier)}`;

  const { error } = await supabase.storage.from("review-proofs").upload(path, fisier, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return { path, publicUrl: null };
}
