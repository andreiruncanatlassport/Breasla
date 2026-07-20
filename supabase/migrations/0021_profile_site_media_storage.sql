-- ============================================================================
-- STORAGE — buckete noi pentru poza de profil (membri) si imagini de
-- stiri/evenimente (admin). Ruleaza dupa 0020_news_events_slugs.sql.
--
-- Conventie de fisiere:
--   profile-media/{profile_id}/avatar.jpg
--   site-media/stiri/{news_id}/{fisier}
--   site-media/evenimente/{event_id}/{fisier}
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- profile-media — citire publica, scriere doar de proprietarul profilului
-- --------------------------------------------------------------------------
create policy "citire publica profile-media" on storage.objects
  for select using (bucket_id = 'profile-media');

create policy "proprietarul incarca in profile-media" on storage.objects
  for insert with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "proprietarul actualizeaza in profile-media" on storage.objects
  for update using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "proprietarul sterge din profile-media" on storage.objects
  for delete using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- --------------------------------------------------------------------------
-- site-media — citire publica, scriere doar admin/moderator (stiri/evenimente)
-- --------------------------------------------------------------------------
create policy "citire publica site-media" on storage.objects
  for select using (bucket_id = 'site-media');

create policy "admin incarca in site-media" on storage.objects
  for insert with check (bucket_id = 'site-media' and public.is_admin_or_mod());

create policy "admin actualizeaza in site-media" on storage.objects
  for update using (bucket_id = 'site-media' and public.is_admin_or_mod());

create policy "admin sterge din site-media" on storage.objects
  for delete using (bucket_id = 'site-media' and public.is_admin_or_mod());
