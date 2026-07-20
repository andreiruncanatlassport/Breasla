import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound, Building2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StartConversationButton } from "@/components/StartConversationButton";
import type { MemberDirectoryEntry } from "@/types/database";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.from("member_directory").select("*").eq("id", id).maybeSingle();
  const membru = data as MemberDirectoryEntry | null;
  if (!membru) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/membri" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-seal">
        <ArrowLeft className="h-4 w-4" /> Toți membrii
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

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">{membru.nume_complet}</h1>
        {membru.titlu && <p className="mt-1 text-sm font-medium text-seal">{membru.titlu}</p>}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-ink-soft">
          {membru.company_denumire && (
            <Link
              href={membru.company_slug ? `/firma/${membru.company_slug}` : `/firma/${membru.company_id}`}
              className="inline-flex items-center gap-1.5 hover:text-seal"
            >
              <Building2 className="h-3.5 w-3.5" /> {membru.company_denumire}
            </Link>
          )}
          {membru.oras && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {membru.oras}
            </span>
          )}
        </div>

        {membru.bio && <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">{membru.bio}</p>}

        {user?.id !== membru.id && (
          <div className="mt-7">
            <StartConversationButton profileId={membru.id} numeDestinatar={membru.nume_complet} autentificat={Boolean(user)} />
          </div>
        )}
      </div>
    </div>
  );
}
