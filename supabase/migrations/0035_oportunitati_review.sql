-- Oportunitatile treceau live imediat la postare — acum trec printr-un
-- review admin obligatoriu, ca sa nu devina o zona de reclame nesolicitate.

do $$
declare
  nume_constrangere text;
begin
  select conname into nume_constrangere
  from pg_constraint
  where conrelid = 'public.opportunities'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%';
  if nume_constrangere is not null then
    execute format('alter table public.opportunities drop constraint %I', nume_constrangere);
  end if;
end $$;

alter table public.opportunities
  add constraint opportunities_status_check
  check (status in ('in_asteptare', 'deschisa', 'respinsa', 'inchisa'));

alter table public.opportunities alter column status set default 'in_asteptare';

-- Protectie: proprietarul firmei poate in continuare sa-si INCHIDA/REDESCHIDA
-- singur oportunitatea odata ce a trecut de moderare (comutare libera intre
-- 'deschisa' si 'inchisa' — functionalitate care exista deja dinainte), dar
-- NU poate sa treaca singur peste moderarea initiala: cat timp starea e
-- 'in_asteptare' sau 'respinsa', doar admin/moderator poate sa o schimbe.
create function public.protect_opportunity_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status in ('in_asteptare', 'respinsa')
     and new.status <> old.status
     and not (public.is_admin_or_mod() or auth.role() = 'service_role') then
    new.status := old.status;
  end if;
  return new;
end;
$$;

create trigger opportunities_protect_status
  before update on public.opportunities
  for each row execute procedure public.protect_opportunity_status();
