-- Propuneri de la membri pentru Stiri si Evenimente.
--
-- Adaugam statusul 'propunere': un articol/eveniment trimis de un membru,
-- vizibil DOAR in panoul de admin (politicile de SELECT existente arata
-- public numai status = 'publicat', deci o propunere ramane invizibila
-- pentru oricine altcineva decat admin/moderator — nu trebuie schimbat
-- nimic acolo). Adminul o gaseste in acelasi ecran de administrare unde
-- vede si ciornele proprii, o editeaza cu acelasi formular si apasa
-- "Publică" ca sa apara oficial pe site.
--
-- Insertia propunerilor se face dintr-o ruta API dedicata, cu clientul de
-- service-role (vezi src/app/api/stiri/propune si /api/evenimente/propune),
-- care forteaza server-side status='propunere' si autor_id=userul curent —
-- nu ne bazam pe policy-uri RLS de INSERT pentru membri, ca sa nu existe
-- nicio cale prin care un membru sa poata seta singur status='publicat'.

do $$
declare
  nume_constrangere text;
begin
  select conname into nume_constrangere
  from pg_constraint
  where conrelid = 'public.news_articles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%';
  if nume_constrangere is not null then
    execute format('alter table public.news_articles drop constraint %I', nume_constrangere);
  end if;
end $$;

alter table public.news_articles
  add constraint news_articles_status_check
  check (status in ('draft', 'propunere', 'publicat'));

do $$
declare
  nume_constrangere text;
begin
  select conname into nume_constrangere
  from pg_constraint
  where conrelid = 'public.events'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%';
  if nume_constrangere is not null then
    execute format('alter table public.events drop constraint %I', nume_constrangere);
  end if;
end $$;

alter table public.events
  add constraint events_status_check
  check (status in ('draft', 'propunere', 'publicat', 'anulat'));
