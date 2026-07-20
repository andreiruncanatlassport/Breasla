-- ============================================================================
-- SLUG-uri automate pentru stiri si evenimente — acelasi model ca la firme
-- (0011_discounts_rfq_slugs.sql), ca sa avem adrese de forma /stiri/titlul-nostru.
-- Ruleaza acest fisier dupa 0019_opportunities.sql.
-- ============================================================================

create or replace function public.genereaza_slug_stire()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  baza text;
  candidat text;
  contor integer := 1;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  baza := lower(new.titlu);
  baza := translate(baza, 'ăâîșşțţĂÂÎȘŞȚŢ', 'aaissttaaisstt');
  baza := regexp_replace(baza, '[^a-z0-9]+', ' ', 'g');
  baza := trim(baza);
  baza := regexp_replace(baza, '\s+', '-', 'g');

  if baza = '' then
    baza := 'stire';
  end if;

  candidat := baza;
  while exists (select 1 from public.news_articles where slug = candidat and id <> new.id) loop
    contor := contor + 1;
    candidat := baza || '-' || contor;
  end loop;

  new.slug := candidat;
  return new;
end;
$$;

create trigger news_articles_genereaza_slug before insert or update on public.news_articles
  for each row execute procedure public.genereaza_slug_stire();

create or replace function public.genereaza_slug_eveniment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  baza text;
  candidat text;
  contor integer := 1;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  baza := lower(new.titlu);
  baza := translate(baza, 'ăâîșşțţĂÂÎȘŞȚŢ', 'aaissttaaisstt');
  baza := regexp_replace(baza, '[^a-z0-9]+', ' ', 'g');
  baza := trim(baza);
  baza := regexp_replace(baza, '\s+', '-', 'g');

  if baza = '' then
    baza := 'eveniment';
  end if;

  candidat := baza;
  while exists (select 1 from public.events where slug = candidat and id <> new.id) loop
    contor := contor + 1;
    candidat := baza || '-' || contor;
  end loop;

  new.slug := candidat;
  return new;
end;
$$;

create trigger events_genereaza_slug before insert or update on public.events
  for each row execute procedure public.genereaza_slug_eveniment();
