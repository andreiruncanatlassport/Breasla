-- Verificare membri de catre admin. Fiecare cont nou e "nou" (neverificat)
-- pana cand un admin ii schimba starea din panoul /admin/membri. "Respins"
-- NU e o stare persistenta — respingerea sterge contul (auth.users, care
-- cascadeaza la profiles si, daca a apucat sa inregistreze o firma, si la
-- firma lui — de-aia UI-ul de admin trebuie sa avertizeze clar inainte).

alter table public.profiles
  add column if not exists stare_verificare text not null default 'nou'
    check (stare_verificare in ('nou', 'verificat', 'neverificat'));

alter table public.profiles
  add column if not exists declaratie_valori boolean not null default false;

comment on column public.profiles.declaratie_valori is
  'Auto-declaratie bifata la inregistrare: persoana declara ca e antreprenor/oare care isi desfasoara activitatea potrivit valorilor crestine. Nu inlocuieste verificarea admin.';

create index if not exists profiles_stare_verificare_idx on public.profiles (stare_verificare);

-- Protectie: un user NU isi poate seta singur stare_verificare (altfel s-ar
-- auto-verifica printr-un update direct din browser). Acelasi tipar ca la
-- protect_email_verificat (migrarea 0010).
create function public.protect_stare_verificare()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin_or_mod() or auth.role() = 'service_role') then
    new.stare_verificare := old.stare_verificare;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_stare_verificare
  before update on public.profiles
  for each row execute procedure public.protect_stare_verificare();
