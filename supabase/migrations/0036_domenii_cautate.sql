-- "Ce cauta" firma — simetric cu "ce ofera" (public.company_categories).
-- Aceeasi taxonomie fixa (public.categories), plus camp liber "altele",
-- exact ca la domenii_altele. Permite matching bidirectional: o firma care
-- OFERA o categorie poate fi potrivita cu una care CAUTA aceeasi categorie.

create table if not exists public.company_categorii_cautate (
  company_id    uuid not null references public.companies (id) on delete cascade,
  category_id   uuid not null references public.categories (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (company_id, category_id)
);

create index if not exists company_categorii_cautate_category_idx
  on public.company_categorii_cautate (category_id);

alter table public.companies add column if not exists domenii_cautate_altele text;

comment on column public.companies.domenii_cautate_altele is
  'Descriere libera a ce cauta firma (parteneri/servicii) in afara taxonomiei fixe — simetric cu domenii_altele.';

alter table public.company_categorii_cautate enable row level security;

create policy "categorii cautate vizibile daca firma e publica sau proprie" on public.company_categorii_cautate
  for select using (
    exists (
      select 1 from public.companies c
      where c.id = company_id and (c.status = 'approved' or c.owner_id = auth.uid() or public.is_admin_or_mod())
    )
  );

create policy "proprietarul isi editeaza categoriile cautate" on public.company_categorii_cautate
  for all using (public.owns_company(company_id) or public.is_admin_or_mod())
  with check (public.owns_company(company_id) or public.is_admin_or_mod());
