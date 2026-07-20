# Actualizare — Comunitate (Știri, Evenimente, Mesaje, Membri, Oportunități)

Acest fișier descrie ce s-a adăugat și exact ce trebuie să rulezi în Supabase ca
să funcționeze. Scris în același stil ca README-ul principal — urmează pașii
în ordine.

---

## 1. Ce e nou

Pagina principală arată acum **Evenimente** și **Știri**, în locul unui simplu
landing page. În plus, au apărut 4 secțiuni noi în navigație:

- **Oportunități** (`/oportunitati`) — board public de proiecte/achiziții/colaborări/
  cereri de servicii, postate de orice firmă verificată. Diferă de "Cereri de
  ofertă" (`/dashboard/cereri`), care rămâne privată, trimisă către firme alese
  manual — nu s-a schimbat nimic la ea.
- **Membri** (`/membri`) — director public de **persoane** (nu firme), cu poză,
  titlu/rol, oraș și o scurtă descriere. Fiecare utilizator își editează
  profilul din **Contul meu → Profilul meu public** (`/dashboard/profil`) și
  poate dezactiva oricând vizibilitatea publică dintr-un comutator.
- **Mesaje** (`/mesaje`) — chat direct, deschis între orice doi membri (nu
  necesită conexiune acceptată între firme, cum funcționează restul
  platformei). Butonul "Trimite mesaj" apare pe profilul unui membru și pe
  profilul unei firme.
- **Știri** (`/stiri`) și **Evenimente** (`/evenimente`, cu înscriere/RSVP) —
  gestionate din **Administrare → Știri / Evenimente**.

## 2. Rulează migrațiile noi (SQL Editor din Supabase)

Exact ca la instalarea inițială: **un singur tab**, reutilizat, rulate **în
ordine**, așteptând mesajul de succes după fiecare.

1. `supabase/migrations/0016_news_events.sql`
2. `supabase/migrations/0017_open_messaging.sql`
3. `supabase/migrations/0018_members_directory.sql`
4. `supabase/migrations/0019_opportunities.sql`
5. `supabase/migrations/0020_news_events_slugs.sql`
6. `supabase/migrations/0021_profile_site_media_storage.sql`

Dacă platforma ta are deja migrațiile `0001`–`0015` rulate (adică ai instalarea
existentă), **nu le rula din nou** — pornește direct de la `0016`.

> **Verificare rapidă:** după pasul 6, mergi la **Storage** în Supabase și ar
> trebui să vezi două bucket-uri noi: `profile-media` (poze de profil) și
> `site-media` (imagini pentru știri/evenimente), pe lângă cele existente.

## 3. Nimic de schimbat la variabilele de mediu

Nu s-a adăugat nicio variabilă nouă — `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` și
`NEXT_PUBLIC_SITE_URL` rămân singurele necesare.

## 4. Cum publici prima Știre / primul Eveniment

1. Intră cu un cont de admin sau moderator (vezi secțiunea 6 din README
   principal dacă nu ai încă unul).
2. **Administrare** (din meniu) → **Știri** sau **Evenimente** → butonul din
   dreapta sus.
3. Completezi formularul, poți încărca o imagine, și alegi **Salvează ciornă**
   (nu apare public încă) sau **Publică** (apare imediat pe site).

## 5. Decizii de design de reținut

- **Mesageria e deschisă între orice membri** — nu mai depinde de o conexiune
  acceptată între firme, spre deosebire de restul platformei. E o schimbare
  intenționată, cerută explicit, ca să semene cu o rețea de comunitate, nu
  doar cu un catalog B2B.
- **Pagina de Membri e publică** (vizibilă și fără cont), la fel ca și
  catalogul de firme — consecvent cu poziționarea platformei ca registru public.
  Numele, poza, titlul, orașul și descrierea sunt publice; telefonul și
  emailul personal **rămân private** ca până acum. Dacă preferi ca `/membri`
  să ceară autentificare, e o schimbare mică (o singură verificare în
  `src/app/membri/page.tsx` și `src/app/membri/[id]/page.tsx`).
- **Oportunitățile publice sunt separate de Cererile de ofertă (RFQ)** —
  intenționat, ca să nu stricăm fluxul existent de negociere/înțelegeri, care
  pornește tot din RFQ. Oportunitățile sunt mai simple: postezi, oricine
  răspunde, apoi continuați prin Mesaje.
- **Homepage-ul** foloseşte acum text în română "hardcodat" pentru
  Evenimente/Știri (nu prin sistemul de traduceri `t.home.*`), la fel ca
  restul paginilor interioare (Dashboard, Catalog) — sistemul de limbă
  (RO/EN) rămâne activ doar pentru navigație și pentru paginile care îl
  foloseau deja.
