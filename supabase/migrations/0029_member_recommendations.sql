-- ============================================================================
-- Recomandari intre MEMBRI (persoana -> persoana), pe langa recenziile
-- existente intre firme. Un membru poate recomanda alt membru DOAR daca au
-- schimbat mesaje (dovada minima de interactiune reala). La 5+ recomandari
-- primite, membrul primeste insigna "Verified" pe profil si card.
-- Ruleaza dupa 0028_profil_complet_tags_suport.sql.
-- ============================================================================

create table if not exists public.member_recommendations (
  id                uuid primary key default gen_random_uuid(),
  recommender_id    uuid not null references public.profiles (id) on delete cascade,
  recommended_id    uuid not null references public.profiles (id) on delete cascade,
  mesaj             text,
  created_at        timestamptz not null default now(),
  check (recommender_id <> recommended_id),
  unique (recommender_id, recommended_id)
);

create index if not exists member_reco_recommended_idx
  on public.member_recommendations (recommended_id);

alter table public.member_recommendations enable row level security;

-- Toata lumea vede recomandarile (sunt un semnal public de incredere).
create policy "recomandari intre membri sunt publice"
  on public.member_recommendations
  for select using (true);

-- Poti recomanda pe cineva DOAR daca ai schimbat mesaje cu el (exista o
-- conversatie in care sunteti amandoi participanti). Verificarea foloseste
-- functia participa_la_conversatie deja definita in 0017.
create or replace function public.a_schimbat_mesaje_cu(alt_membru uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp_eu
    join public.conversation_participants cp_alt
      on cp_alt.conversation_id = cp_eu.conversation_id
    where cp_eu.profile_id = auth.uid()
      and cp_alt.profile_id = alt_membru
  );
$$;

create policy "recomanzi doar pe cine ai mesajerit"
  on public.member_recommendations
  for insert with check (
    recommender_id = auth.uid()
    and public.a_schimbat_mesaje_cu(recommended_id)
  );

-- Iti poti retrage propria recomandare.
create policy "iti stergi propria recomandare"
  on public.member_recommendations
  for delete using (recommender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Recream member_directory cu numarul de recomandari + flagul "verified"
-- (5+ recomandari). Asa cardul si filtrele au datele direct, fara join extra.
-- Defensiv: ne asiguram ca toate coloanele de profil folosite mai jos exista
-- (in caz ca o migratie anterioara a fost sarita), ca sa nu pice recrearea.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists titlu text,
  add column if not exists bio text,
  add column if not exists oras text,
  add column if not exists judet_cod text references public.judete (cod),
  add column if not exists firma_declarata text,
  add column if not exists linkedin_url text,
  add column if not exists cauta_suport text,
  add column if not exists cauta_suport_category_ids uuid[] not null default '{}',
  add column if not exists public_vizibil boolean not null default true;

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
  coalesce(rec.nr, 0) as nr_recomandari,
  coalesce(rec.nr, 0) >= 5 as verificat,
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
left join lateral (
  select count(*) as nr
  from public.member_recommendations mr
  where mr.recommended_id = p.id
) rec on true
where p.activ = true and p.public_vizibil = true;

grant select on public.member_directory to anon, authenticated;
