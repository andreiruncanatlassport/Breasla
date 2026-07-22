-- Doi membri nu ar trebui sa poata avea acelasi email personal. Adaugam un
-- index UNIC, case-insensitive (ca "Ion@X.com" si "ion@x.com" sa conteze tot
-- ca duplicat), pe profiles.email_personal.
--
-- ATENTIE la rulare: daca exista deja randuri cu acelasi email_personal (din
-- orice motiv trecut), aceasta comanda va esua cu "could not create unique
-- index — duplicate key value". Inainte sa rulezi migrarea asta, verifica cu:
--
--   select lower(email_personal), count(*)
--   from public.profiles
--   where email_personal is not null
--   group by lower(email_personal)
--   having count(*) > 1;
--
-- Daca returneaza randuri, rezolva manual duplicatele (schimba/goleste
-- email_personal pe unul dintre profiluri) inainte de a re-rula fisierul asta.

create unique index if not exists profiles_email_personal_unic
  on public.profiles (lower(email_personal))
  where email_personal is not null;
