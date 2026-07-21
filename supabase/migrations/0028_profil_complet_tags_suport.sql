-- ============================================================================
-- Profil public complet la inregistrare + tag-uri predefinite de suport
-- (folosim aceeasi taxonomie de categorii de business, ca "domenii in care
-- am nevoie de ajutor" — cateva predefinite + optiunea "Altele" cu text
-- liber, cum s-a cerut). Extinde si member_directory pentru cautare si
-- filtrare avansata pe pagina de Membri.
-- Ruleaza dupa 0027_domenii_altele_membri_vizibili.sql.
-- ============================================================================

alter table public.profiles
  add column if not exists judet_cod text references public.judete (cod),
  add column if not exists firma_declarata text,
  add column if not exists linkedin_url text,
  add column if not exists cauta_suport_category_ids uuid[] not null default '{}';

comment on column public.profiles.linkedin_url is
  'Link catre profilul LinkedIn (optional) — camp din profilul public, ca in aplicatia AER.';

comment on column public.profiles.judet_cod is
  'Judetul membrului (localitate structurata, ceruta la inregistrare) — folosit si pentru filtrare in /membri.';
comment on column public.profiles.firma_declarata is
  'Numele firmei la care lucreaza/reprezinta membrul, declarat liber la inregistrare — distinct de o firma verificata prin ANAF din tabelul companies.';
comment on column public.profiles.cauta_suport_category_ids is
  'Domenii predefinite (din categories) la care membrul cauta ajutor. Campul text cauta_suport ramane pentru "Altele" / detalii libere.';

-- Recream vederea publica, extinsa cu tot ce trebuie pentru cautare si
-- filtrare pe pagina de Membri: judet, firma declarata, tag-urile de suport
-- (id-uri + text agregat pt cautare), si domeniile firmei verificate (daca
-- exista), tot ca text agregat pt cautare ("Sport" sa gaseasca si in domeniu).
drop view if exists public.member_directory;

create view public.member_directory as
select
  p.id,
  p.nume_complet,
  p.avatar_url,
  p.titlu,
  p.bio,
  p.oras,
  p.judet_cod,
  j.nume as judet_nume,
  p.firma_declarata,
  p.linkedin_url,
  p.cauta_suport,
  p.cauta_suport_category_ids,
  coalesce(st.tags_text, '') as cauta_suport_tags_text,
  p.created_at,
  c.id as company_id,
  c.denumire as company_denumire,
  c.slug as company_slug,
  c.logo_url as company_logo_url,
  c.descriere as company_descriere,
  coalesce(cd.domenii_text, '') as company_domenii_text
from public.profiles p
left join public.judete j on j.cod = p.judet_cod
left join lateral (
  select co.id, co.denumire, co.slug, co.logo_url, co.descriere
  from public.companies co
  where co.owner_id = p.id and co.status = 'approved'
  order by co.created_at asc
  limit 1
) c on true
left join lateral (
  select string_agg(distinct cat.name_ro, ', ') as domenii_text
  from public.company_categories cc
  join public.categories cat on cat.id = cc.category_id
  where cc.company_id = c.id
) cd on true
left join lateral (
  select string_agg(cat2.name_ro, ', ') as tags_text
  from public.categories cat2
  where cat2.id = any(p.cauta_suport_category_ids)
) st on true
where p.activ = true and p.public_vizibil = true;

grant select on public.member_directory to anon, authenticated;
