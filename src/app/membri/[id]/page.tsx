import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound, Building2, MapPin, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { StartConversationButton } from "@/components/StartConversationButton";
import { RecommendButton } from "@/components/RecommendButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { MemberDirectoryEntry } from "@/types/database";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { t } = await getT();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.from("member_directory").select("*").eq("id", id).maybeSingle();
  const membru = data as MemberDirectoryEntry | null;
  if (!membru) notFound();

  // Poate userul curent sa recomande acest membru? Doar daca a schimbat mesaje
  // cu el (verificat in DB prin functia a_schimbat_mesaje_cu) si nu e el insusi.
  let aRecomandatDeja = false;
  let poateRecomanda = false;
  if (user && user.id !== membru.id) {
    const [{ data: recExist }, { data: potRec }] = await Promise.all([
      supabase
        .from("member_recommendations")
        .select("id")
        .eq("recommender_id", user.id)
        .eq("recommended_id", membru.id)
        .maybeSingle(),
      supabase.rpc("a_schimbat_mesaje_cu", { alt_membru: membru.id }),
    ]);
    aRecomandatDeja = Boolean(recExist);
    poateRecomanda = potRec === true || aRecomandatDeja;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/membri" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> {t.members.allMembers}
      </Link>

      <div className="block-base mt-6 flex flex-col items-center p-8 text-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line">
          {membru.avatar_url ? (
            <Image src={membru.avatar_url} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft/40">
              <UserRound className="h-10 w-10" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{membru.nume_complet}</h1>
          {membru.verificat && <VerifiedBadge nrRecomandari={membru.nr_recomandari} />}
        </div>
        {membru.titlu && <p className="mt-1 text-sm font-medium text-seal">{membru.titlu}</p>}
        {membru.nr_recomandari > 0 && (
          <p className="mt-1.5 text-xs font-medium text-ink-soft">
            <span className="font-mono-num font-semibold text-ink">{membru.nr_recomandari}</span>{" "}
            {membru.nr_recomandari === 1 ? "recomandare" : "recomandări"} de la alți membri
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-ink-soft">
          {membru.company_denumire ? (
            <Link
              href={membru.company_slug ? `/firma/${membru.company_slug}` : `/firma/${membru.company_id}`}
              className="inline-flex items-center gap-1.5 hover:text-seal"
            >
              <Building2 className="h-3.5 w-3.5" /> {membru.company_denumire}
            </Link>
          ) : (
            membru.firma_declarata && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {membru.firma_declarata}
              </span>
            )
          )}
          {(membru.oras || membru.judet_nume) && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {[membru.oras, membru.judet_nume].filter(Boolean).join(", ")}
            </span>
          )}
        </div>

        {membru.bio && <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">{membru.bio}</p>}

        {membru.linkedin_url && (
          <a
            href={membru.linkedin_url.startsWith("http") ? membru.linkedin_url : `https://${membru.linkedin_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-seal hover:underline"
          >
            <Link2 className="h-4 w-4" /> LinkedIn
          </a>
        )}

        {(membru.cauta_suport_tags_text || membru.cauta_suport) && (
          <div className="mt-5 max-w-md rounded-xl border border-seal/25 bg-seal/6 p-4 text-left">
            <p className="stamp-label text-seal">Caută ajutor la</p>
            {membru.cauta_suport_tags_text && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {membru.cauta_suport_tags_text.split(", ").filter(Boolean).map((tag) => (
                  <span key={tag} className="rounded-full bg-seal/15 px-2.5 py-1 text-xs font-semibold text-seal">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {membru.cauta_suport && <p className="mt-2 text-sm leading-relaxed text-ink">{membru.cauta_suport}</p>}
          </div>
        )}

        {user?.id !== membru.id && (
          <div className="mt-7 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <StartConversationButton profileId={membru.id} numeDestinatar={membru.nume_complet} autentificat={Boolean(user)} />
              {poateRecomanda && (
                <RecommendButton
                  membruId={membru.id}
                  aRecomandatDeja={aRecomandatDeja}
                  autentificat={Boolean(user)}
                />
              )}
            </div>
            {user && !poateRecomanda && (
              <p className="max-w-xs text-center text-xs text-ink-soft/70">
                Poți recomanda acest membru după ce schimbați câteva mesaje.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
