-- ============================================================================
-- OPORTUNITATI — board public de proiecte/achizitii/colaborari/cereri de
-- servicii postate de membri (spre deosebire de RFQ, care e privat si
-- trimis catre firme alese manual). Orice firma poate raspunde public.
-- Ruleaza acest fisier dupa 0018_members_directory.sql.
-- ============================================================================

create table public.opportunities (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies (id) on delete cascade,
  titlu             text not null,
  descriere         text not null,
  tip               text not null default 'proiect' check (tip in ('proiect', 'achizitie', 'colaborare', 'cerere_servicii')),
  category_id       uuid references public.categories (id),
  judet_cod         text references public.judete (cod),
  buget_min         numeric,
  buget_max         numeric,
  termen_limita     date,
  status            text not null default 'deschisa' check (status in ('deschisa', 'inchisa')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index opportunities_status_idx on public.opportunities (status, created_at desc);
create index opportunities_category_idx on public.opportunities (category_id);
create index opportunities_judet_idx on public.opportunities (judet_cod);

create trigger opportunities_updated_at before update on public.opportunities
  for each row execute procedure public.set_updated_at();

create table public.opportunity_responses (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  company_id      uuid not null references public.companies (id) on delete cascade,
  mesaj           text not null,
  pret_estimat    numeric,
  created_at      timestamptz not null default now(),
  unique (opportunity_id, company_id)
);

create index opportunity_responses_opportunity_idx on public.opportunity_responses (opportunity_id, created_at);
create index opportunity_responses_company_idx on public.opportunity_responses (company_id);

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.opportunities enable row level security;
alter table public.opportunity_responses enable row level security;

-- Board public: oportunitatile deschise sunt vizibile tuturor; cele inchise
-- raman vizibile doar autorului si adminului (istoric).
create policy "oportunitati deschise publice, proprii si admin vizibile" on public.opportunities
  for select using (
    status = 'deschisa' or public.owns_company(company_id) or public.is_admin_or_mod()
  );

create policy "firma mea posteaza o oportunitate" on public.opportunities
  for insert with check (public.owns_company(company_id));

create policy "proprietarul sau adminul editeaza/inchide oportunitatea" on public.opportunities
  for update using (public.owns_company(company_id) or public.is_admin_or_mod());

create policy "proprietarul sau adminul sterge oportunitatea" on public.opportunities
  for delete using (public.owns_company(company_id) or public.is_admin_or_mod());

-- Raspunsurile: vizibile autorului oportunitatii si celui care a raspuns
create policy "raspunsurile vizibile autorului oportunitatii si respondentului" on public.opportunity_responses
  for select using (
    public.owns_company(company_id)
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and public.owns_company(o.company_id))
    or public.is_admin_or_mod()
  );

create policy "orice firma poate raspunde la o oportunitate deschisa" on public.opportunity_responses
  for insert with check (
    public.owns_company(company_id)
    and exists (select 1 from public.opportunities o where o.id = opportunity_id and o.status = 'deschisa')
  );

create policy "respondentul isi editeaza propriul raspuns" on public.opportunity_responses
  for update using (public.owns_company(company_id));

create policy "respondentul isi sterge propriul raspuns" on public.opportunity_responses
  for delete using (public.owns_company(company_id) or public.is_admin_or_mod());
