import Link from "next/link";
import Image from "next/image";
import { UserRound, Building2 } from "lucide-react";

export interface MemberCardData {
  id: string;
  nume_complet: string;
  avatar_url: string | null;
  titlu: string | null;
  oras: string | null;
  company_denumire: string | null;
  company_slug: string | null;
}

export function MemberCard({ member }: { member: MemberCardData }) {
  return (
    <Link href={`/membri/${member.id}`} className="group block h-full active:scale-[0.98] transition-transform duration-150">
      <article className="lift-on-hover block-base flex h-full flex-col items-center p-6 text-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-ink/5 ring-1 ring-inset ring-line">
          {member.avatar_url ? (
            <Image src={member.avatar_url} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft/40">
              <UserRound className="h-8 w-8" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <h3 className="mt-3.5 font-display text-base font-semibold text-ink">{member.nume_complet}</h3>
        {member.titlu && <p className="mt-0.5 text-xs font-medium text-seal">{member.titlu}</p>}
        {member.company_denumire && (
          <p className="mt-2 flex items-center gap-1 text-xs text-ink-soft">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{member.company_denumire}</span>
          </p>
        )}
        {member.oras && <p className="mt-1 text-xs text-ink-soft/70">{member.oras}</p>}
      </article>
    </Link>
  );
}
