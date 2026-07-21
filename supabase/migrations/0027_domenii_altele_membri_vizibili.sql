-- ============================================================================
-- 1) "Altul" la domeniile de activitate — text liber pentru firmele al caror
--    domeniu nu se regaseste (inca) in lista de categorii. Feedback direct
--    din testare: "trebuie sa ai si optiune altele, sa scrii tu de mana".
-- 2) Backfill vizibilitate membri — toti cei inregistrati apar in /membri
--    (era deja comportamentul implicit; aducem la zi si eventualele conturi
--    mai vechi). Optiunea de a te ascunde ramane in /dashboard/profil.
-- Ruleaza dupa 0026_personal_support_needed.sql.
-- ============================================================================

alter table public.companies
  add column if not exists domenii_altele text;

comment on column public.companies.domenii_altele is
  'Text liber: domenii de activitate care nu exista in lista de categorii. Afisat pe profilul firmei lang domeniile bifate.';

update public.profiles set public_vizibil = true where public_vizibil = false;
