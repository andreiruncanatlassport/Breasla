-- ============================================================================
-- GALERIE FOTO LA DESCRIEREA FIRMEI — cateva imagini (nu structurate ca
-- proiecte de portofoliu) care insotesc descrierea de pe profilul public.
-- Ruleaza acest fisier dupa 0021_profile_site_media_storage.sql.
-- ============================================================================

alter table public.companies
  add column if not exists descriere_imagini text[] not null default '{}';

comment on column public.companies.descriere_imagini is
  'URL-uri de imagini (bucket company-media) afisate langa descrierea firmei pe profilul public. Max recomandat: 6.';
