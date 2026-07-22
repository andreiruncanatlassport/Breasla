-- Zona deservita, in text liber, scrisa de mana de firma la inregistrare
-- (ex: "Cluj și împrejurimi", "online, la nivel național"). Completeaza
-- campurile structurate existente (raza_deservire_km, judete_suplimentare
-- din tabelul company_judete), care raman optionale.

alter table public.companies add column if not exists zona_deservita text;

comment on column public.companies.zona_deservita is
  'Descriere libera, scrisa de firma, a zonei pe care o deserveste. Completeaza campurile structurate raza_deservire_km si judetele suplimentare (tabel company_judete), care raman optionale.';
