-- ============================================================================
-- STIRI & EVENIMENTE — pagina principala devine un feed de continut (dupa
-- modelul aplicatiei AER: sectiune de Stiri + sectiune de Evenimente).
-- Ruleaza acest fisier dupa 0015_reviews_from_deals.sql.
-- ============================================================================

-- ============================================================================
-- STIRI
-- ============================================================================
create table public.news_articles (
  id            uuid primary key default gen_random_uuid(),
  autor_id      uuid references public.profiles (id) on delete set null,
  titlu         text not null,
  slug          text not null unique,
  rezumat       text,
  continut      text not null,
  imagine_url   text,
  status        text not null default 'draft' check (status in ('draft', 'publicat')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index news_articles_status_idx on public.news_articles (status, published_at desc);

create trigger news_articles_updated_at before update on public.news_articles
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- EVENIMENTE
-- ============================================================================
create table public.events (
  id              uuid primary key default gen_random_uuid(),
  autor_id        uuid references public.profiles (id) on delete set null,
  titlu           text not null,
  slug            text not null unique,
  descriere       text not null,
  imagine_url     text,
  tip             text not null default 'networking' check (tip in ('conferinta', 'workshop', 'networking', 'altul')),
  locatie         text,
  online          boolean not null default false,
  link_extern     text,
  data_inceput    timestamptz not null,
  data_sfarsit    timestamptz,
  capacitate      integer,
  status          text not null default 'publicat' check (status in ('draft', 'publicat', 'anulat')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index events_status_idx on public.events (status, data_inceput);

create trigger events_updated_at before update on public.events
  for each row execute procedure public.set_updated_at();

-- Inscrieri (RSVP) la evenimente
create table public.event_registrations (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  nota          text,
  created_at    timestamptz not null default now(),
  unique (event_id, profile_id)
);

create index event_registrations_event_idx on public.event_registrations (event_id);
create index event_registrations_profile_idx on public.event_registrations (profile_id);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.news_articles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

-- Stirile publicate sunt publice; draft-urile doar pentru admin/moderator
create policy "stiri publicate vizibile tuturor" on public.news_articles
  for select using (status = 'publicat' or public.is_admin_or_mod());

create policy "doar admin/moderator scrie stiri" on public.news_articles
  for insert with check (public.is_admin_or_mod());
create policy "doar admin/moderator editeaza stiri" on public.news_articles
  for update using (public.is_admin_or_mod());
create policy "doar admin/moderator sterge stiri" on public.news_articles
  for delete using (public.is_admin_or_mod());

-- Evenimentele publicate sunt publice; draft doar admin/moderator
create policy "evenimente publicate vizibile tuturor" on public.events
  for select using (status in ('publicat', 'anulat') or public.is_admin_or_mod());

create policy "doar admin/moderator scrie evenimente" on public.events
  for insert with check (public.is_admin_or_mod());
create policy "doar admin/moderator editeaza evenimente" on public.events
  for update using (public.is_admin_or_mod());
create policy "doar admin/moderator sterge evenimente" on public.events
  for delete using (public.is_admin_or_mod());

-- Inscrierile: fiecare isi vede propria inscriere; adminul le vede pe toate;
-- autorul evenimentului le vede pe toate (ca sa stie cati vin).
create policy "vad propriile inscrieri sau adminul/autorul evenimentului" on public.event_registrations
  for select using (
    profile_id = auth.uid()
    or public.is_admin_or_mod()
    or exists (select 1 from public.events e where e.id = event_id and e.autor_id = auth.uid())
  );

create policy "ma inscriu singur la un eveniment" on public.event_registrations
  for insert with check (profile_id = auth.uid());

create policy "imi anulez singur inscrierea" on public.event_registrations
  for delete using (profile_id = auth.uid() or public.is_admin_or_mod());
