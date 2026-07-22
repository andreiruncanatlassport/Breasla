-- ============================================================================
-- DIRECTOR DE MEMBRI — profil public de persoana, separat de profilul firmei.
-- Extindem `profiles` cu campuri publice optionale si expunem doar acele
-- campuri (niciodata telefon/email personal) printr-o vedere publica.
-- Ruleaza acest fisier dupa 0017_open_messaging.sql.
-- ============================================================================

alter table public.profiles
  add column if not exists avatar_url    text,
  add column if not exists titlu         text,          -- ex: "Fondator", "Manager vanzari"
  add column if not exists bio           text,
  add column if not exists oras          text,
  add column if not exists public_vizibil boolean not null default true;

comment on column public.profiles.public_vizibil is
  'Daca e true, persoana apare in /membri cu nume, poza, titlu, bio, oras — NICIODATA telefon/email.';

-- Vedere publica: doar campuri sigure, doar profile active si vizibile.
-- Definim explicit coloanele expuse (nu select *), ca sa nu scapam accidental
-- date sensibile daca se adauga o coloana noua in profiles mai tarziu.
create view public.member_directory as
select
  p.id,
  p.nume_complet,
  p.avatar_url,
  p.titlu,
  p.bio,
  p.oras,
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

-- Permite oricui autentificat sa-si actualizeze propriile campuri publice —
-- politica de update pe profiles exista deja ("profil propriu editabil"),
-- deci nu mai trebuie nimic in plus aici.
