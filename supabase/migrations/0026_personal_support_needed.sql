-- ============================================================================
-- "LA CE AJUTOR AI NEVOIE" — camp personal (nu de firma), pe profilul de
-- membru. Diferit de nevoile/ofertele de la nivel de firma din inregistrare;
-- acesta e despre persoana: networking, consultanta, vanzari, marketing etc.
-- Ruleaza acest fisier dupa 0025_opportunity_image.sql.
-- ============================================================================

alter table public.profiles
  add column if not exists cauta_suport text;

comment on column public.profiles.cauta_suport is
  'Text liber: la ce ajutor/suport are nevoie persoana din partea comunitatii (ex: networking, vanzari, consultanta). Afisat pe profilul public de membru.';

-- Recream vederea publica ca sa includa si noul camp (vederile nu accepta
-- ADD COLUMN — trebuie redefinite complet).
drop view if exists public.member_directory;

create view public.member_directory as
select
  p.id,
  p.nume_complet,
  p.avatar_url,
  p.titlu,
  p.bio,
  p.oras,
  p.cauta_suport,
  p.created_at,
  c.id as company_id,
  c.denumire as company_denumire,
  c.slug as company_slug,
  c.logo_url as company_logo_url
from public.profiles p
left join lateral (
  select co.id, co.denumire, co.slug, co.logo_url
  from public.companies co
  where co.owner_id = p.id and co.status = 'approved'
  order by co.created_at asc
  limit 1
) c on true
where p.activ = true and p.public_vizibil = true;

grant select on public.member_directory to anon, authenticated;
