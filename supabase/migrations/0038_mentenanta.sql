-- Mod mentenanta: cand e activ, doar admin/moderator mai vede site-ul ca de
-- obicei — oricine altcineva (inclusiv vizitatori neautentificati) e
-- redirectionat catre o pagina de mentenanta. Util cand vrei sa verifici o
-- schimbare noua inainte s-o vada toata lumea.
--
-- Tabel "singleton" (un singur rand posibil, garantat de check-ul pe id).

create table public.platform_settings (
  id                       boolean primary key default true,
  mentenanta_activa        boolean not null default false,
  mentenanta_mesaj         text,
  mentenanta_activata_de   uuid references public.profiles (id) on delete set null,
  mentenanta_activata_la   timestamptz,
  updated_at               timestamptz not null default now(),
  constraint platform_settings_singleton check (id)
);

insert into public.platform_settings (id, mentenanta_activa) values (true, false);

create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row execute procedure public.set_updated_at();

alter table public.platform_settings enable row level security;

-- Trebuie citibil de ORICINE (inclusiv vizitatori neautentificati) — altfel
-- nu avem cum sa decidem, chiar in middleware, daca aratam pagina de
-- mentenanta sau site-ul normal.
create policy "setarile platformei sunt public vizibile" on public.platform_settings
  for select using (true);

create policy "doar admin/moderator schimba setarile platformei" on public.platform_settings
  for update using (public.is_admin_or_mod())
  with check (public.is_admin_or_mod());
