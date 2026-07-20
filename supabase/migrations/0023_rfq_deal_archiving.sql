-- ============================================================================
-- ARHIVARE (Cereri de ofertă / Înțelegeri) — fiecare firmă își poate ascunde
-- din lista activă o cerere sau o înțelegere, fără să afecteze cealaltă parte
-- si fara sa se piarda istoricul (nu e o stergere).
-- Ruleaza acest fisier dupa 0022_company_description_gallery.sql.
-- ============================================================================

create table public.rfq_arhivari (
  company_id  uuid not null references public.companies (id) on delete cascade,
  rfq_id      uuid not null references public.rfqs (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (company_id, rfq_id)
);

create table public.deal_arhivari (
  company_id  uuid not null references public.companies (id) on delete cascade,
  deal_id     uuid not null references public.deals (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (company_id, deal_id)
);

alter table public.rfq_arhivari enable row level security;
alter table public.deal_arhivari enable row level security;

create policy "firma isi vede propriile arhivari de cereri" on public.rfq_arhivari
  for select using (public.owns_company(company_id));
create policy "firma isi arhiveaza propriile cereri" on public.rfq_arhivari
  for insert with check (public.owns_company(company_id));
create policy "firma isi dezarhiveaza propriile cereri" on public.rfq_arhivari
  for delete using (public.owns_company(company_id));

create policy "firma isi vede propriile arhivari de intelegeri" on public.deal_arhivari
  for select using (public.owns_company(company_id));
create policy "firma isi arhiveaza propriile intelegeri" on public.deal_arhivari
  for insert with check (public.owns_company(company_id));
create policy "firma isi dezarhiveaza propriile intelegeri" on public.deal_arhivari
  for delete using (public.owns_company(company_id));
