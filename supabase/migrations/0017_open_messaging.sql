-- ============================================================================
-- MESAJE DIRECTE — chat deschis intre orice doi membri (nu doar firme cu
-- conexiune acceptata). Inlocuieste, ca UI, vechea tabela `messages` legata
-- de `connections` (ramasa neschimbata, neutilizata deocamdata).
-- Ruleaza acest fisier dupa 0016_news_events.sql.
-- ============================================================================

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id   uuid not null references public.conversations (id) on delete cascade,
  profile_id        uuid not null references public.profiles (id) on delete cascade,
  last_read_at      timestamptz,
  created_at        timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create index conversation_participants_profile_idx on public.conversation_participants (profile_id);

create table public.direct_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id),
  continut        text not null,
  created_at      timestamptz not null default now()
);

create index direct_messages_conversation_idx on public.direct_messages (conversation_id, created_at);

-- --------------------------------------------------------------------------
-- Functie ajutatoare: sunt participant la conversatia X?
-- --------------------------------------------------------------------------
create function public.participa_la_conversatie(target_conversation_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = target_conversation_id and profile_id = auth.uid()
  );
$$;

-- Actualizeaza last_message_at pe conversatie la fiecare mesaj nou —
-- asa putem sorta lista de conversatii dupa activitate recenta.
create function public.atinge_conversatia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger direct_messages_atinge_conversatia after insert on public.direct_messages
  for each row execute procedure public.atinge_conversatia();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.direct_messages enable row level security;

create policy "vad conversatiile in care sunt participant" on public.conversations
  for select using (public.participa_la_conversatie(id));

-- crearea unei conversatii se face din server (route handler), cu service
-- role, imediat urmata de adaugarea participantilor in acelasi apel — nu are
-- nevoie de policy de insert separata pentru utilizatori.

create policy "vad participantii conversatiilor mele" on public.conversation_participants
  for select using (public.participa_la_conversatie(conversation_id));

create policy "imi actualizez propriul last_read_at" on public.conversation_participants
  for update using (profile_id = auth.uid());

create policy "vad mesajele conversatiilor mele" on public.direct_messages
  for select using (public.participa_la_conversatie(conversation_id));

create policy "trimit mesaje doar in conversatii unde sunt participant" on public.direct_messages
  for insert with check (
    sender_id = auth.uid() and public.participa_la_conversatie(conversation_id)
  );
