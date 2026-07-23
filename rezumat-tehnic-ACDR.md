# Rezumat tehnic — Platforma ACDR (Antreprenori Creștini din România)

*Document de referință pentru discuții cu experți IT.*

---

## 0. Audit de securitate — ce am verificat, ce am găsit, ce am reparat

Pe parcursul mai multor treceri prin cod, am verificat concret (nu presupus) punctele care contează cel mai mult într-o platformă cu conturi, date personale și panou de administrare: cine poate scrie ce, cine poate deveni admin, ce se întâmplă cu erorile, și ce e expus public. Tabelul de mai jos e rezultatul, onest — inclusiv ce a fost găsit greșit.

| # | Severitate | Ce am găsit | Status |
|---|---|---|---|
| 1 | **Critică** | `profiles.rol` (user/moderator/admin) nu era protejat la nivel de coloană — orice cont autentificat putea, printr-un request trimis direct (ocolind interfața), să-și seteze singur `rol = 'admin'` și să obțină acces complet la panoul de administrare. Exista de la prima versiune a schemei. | ✅ Reparat — trigger care blochează orice schimbare de rol venită de la altcineva decât admin/server |
| 2 | Medie | ~25 de rute API întorceau mesaje brute de eroare din Postgres către utilizator (nume de constrângeri, coloane, tabele — detalii tehnice interne, nu o gaură de acces, dar informație care nu ar trebui expusă) | ✅ Reparat — helper comun care sanitizează orice eroare, loghează detaliile doar server-side |
| 3 | Medie | Ștergerea unei firme eșua mereu pentru orice firmă care trecuse vreodată prin aprobare admin, din cauza unor legături către alte tabele (jurnal de audit, mesagerie, negocieri) fără acțiune `ON DELETE` definită | ✅ Reparat — legăturile respective folosesc acum `ON DELETE SET NULL` (păstrează istoricul, nu blochează operațiunea) |
| 4 | Joasă | O interogare ambiguă (companie → județ, prin două căi diferite în schemă) făcea ca secțiunea de firme de pe homepage să dispară silențios, fără nicio eroare vizibilă în log-uri | ✅ Reparat — eliminată ambiguitatea, plus logare explicită a erorilor pe viitor |
| 5 | Joasă / integritate date | Nu exista constrângere care să interzică doi membri cu același email | ✅ Reparat — index unic (case-insensitive) |
| 6 | Lipsă funcționalitate | Niciun cont nou nu trecea prin verificare umană — doar existența legală a firmei (ANAF) era validată, nu și persoana din spate | ✅ Adăugat — flux complet de verificare admin (nou/verificat/neverificat), cu auto-declarație la înregistrare |
| 7 | Confidențialitate | Telefonul și emailul firmei erau complet publice, vizibile oricui, fără cont | ✅ Reparat — vizibile acum doar membrilor autentificați și verificați |
| 8 | Anti-spam | Oportunitățile postate deveneau publice imediat, fără nicio verificare | ✅ Adăugat — trec printr-o coadă de aprobare admin înainte să apară public |
| 9 | Bot/spam la înregistrare | Nu exista nicio protecție împotriva creării automate de conturi (script-uri) | ✅ Adăugat — integrare Cloudflare Turnstile pe înregistrare și login (necesită configurare finală în Cloudflare + Supabase, în curs) |

**Ce rămâne deschis, onest, fără să ascund nimic:**

| Lipsă | Risc | Recomandare |
|---|---|---|
| Fără teste automate (unit/integration) | Regresii nedetectate la schimbări viitoare | De adăugat treptat, măcar pe fluxurile critice (autentificare, plăți/oportunități) |
| Fără rate-limiting propriu pe rutele API | Expunere teoretică la abuz/brute-force dincolo de limitele implicite Supabase/Railway | De evaluat dacă traficul o cere; Cloudflare (deja folosit pentru Turnstile) oferă și rate-limiting |
| Helper de middleware pentru reîmprospătarea sesiunii scris, dar neconectat (`middleware.ts` lipsă) | Nu e o gaură de securitate, dar e cod mort / inconsistență | De conectat sau eliminat |
| `zod` și `react-hook-form` instalate, nefolosite nicăieri | Validare de input scrisă manual, inconsistent, în fiecare rută | De adoptat pentru validare uniformă, sau eliminat din dependențe |
| Migrările SQL se aplică manual, separat de deploy-ul de cod | Risc de desincronizare cod ↔ schemă dacă se uită un pas | De automatizat (`supabase db push` în pipeline-ul de deploy) |

---

## 1. Stack, pe scurt

| Strat | Tehnologie |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript peste tot (strict mode) |
| Stilizare | Tailwind CSS v4 |
| Backend | Fără server separat — logica de backend trăiește în același proiect Next.js, ca API routes (Route Handlers) |
| Bază de date | PostgreSQL, găzduit de Supabase |
| Autentificare | Supabase Auth (email + parolă), cu protecție Cloudflare Turnstile |
| Fișiere / imagini | Supabase Storage |
| Găzduire | Railway |
| Cod sursă | Git, ~37 de migrări SQL versionate |

Nu e un stack exotic — e o alegere comună pentru acest tip de aplicație (marketplace/comunitate cu conturi, căutare, upload de imagini): un singur framework full-stack (Next.js) peste o platformă de backend-as-a-service (Supabase), fără server propriu de administrat.

---

## 2. Front-end

- **React 19 + Next.js App Router** — fiecare pagină e implicit un *Server Component* (randat pe server, HTML gata construit trimis la client — bun pentru SEO și încărcare rapidă). Componentele interactive (formulare, butoane cu stare) sunt marcate explicit `"use client"`.
- **Tailwind CSS v4**, cu un mic sistem de design intern (culori, umbre, radius — definite ca variabile CSS, nu hardcodate).
- Fără Redux sau alt state-management extern — starea e locală (React `useState`) sau vine direct din date randate pe server.
- **PWA** (Progressive Web App): are `manifest.ts`, iconițe dedicate, și un banner de "adaugă pe ecranul principal" — aplicația se poate instala pe telefon.
- ~16 secțiuni principale de pagini (catalog firme, oportunități, știri, evenimente, dashboard membru, panou de administrare etc.) și ~39 de rute API.

---

## 3. Back-end (API routes)

- Fiecare rută API e un fișier `route.ts`, cu funcții `GET` / `POST` / `PATCH` / `DELETE` separate, care rulează **doar pe server** — codul lor nu ajunge niciodată în bundle-ul trimis către browser.
- Fiecare rută care modifică date verifică explicit identitatea și rolul userului (`supabase.auth.getUser()`) înainte de orice operațiune — verificat direct, rută cu rută (vezi Auditul de mai sus).
- Validarea datelor de intrare e făcută manual, în fiecare rută (vezi gap-ul cu `zod`/`react-hook-form` de mai sus).

---

## 4. Baza de date — securitatea, în detaliu

Acesta e cel mai solid aspect tehnic al proiectului:

- **~37 de migrări SQL** versionate în git — fiecare schimbare de schemă e un fișier `.sql` numerotat secvențial. Aplicarea lor în Supabase e momentan un pas **manual**, separat de deploy-ul automat al codului.
- **Row Level Security (RLS) activă pe toate tabelele sensibile — peste 119 politici RLS** scrise explicit. Regulile de acces ("cine poate citi/scrie ce rând, în ce condiții") sunt impuse **la nivelul bazei de date**, nu doar în codul aplicației.
- **Două tipuri de client Supabase**, folosite deliberat diferit:
  - clientul normal (`anon key`) — respectă RLS; folosit peste tot unde acționează un utilizator obișnuit.
  - clientul `service_role` — ocolește RLS complet; folosit **strict** în rute server-side pentru operațiuni administrative — cheia lui nu e niciodată expusă către browser. *(Auditate explicit toate cele 10 rute care-l folosesc — toate verifică rolul înainte de a-l folosi.)*
- **Triggere de protecție la nivel de coloană** — câmpuri sensibile (rolul userului, dacă emailul e verificat, dacă un cont e verificat de admin, statusul unei oportunități, câmpurile de moderare ale unei firme) au triggere PostgreSQL care resping orice modificare venită de la altcineva decât admin sau service-role. RLS obișnuit nu poate restricționa coloană-cu-coloană într-un singur rând; triggerele astea acoperă exact acel gol — **inclusiv cel critic găsit la punctul 1 din audit**.
- **Verificare CUI prin API-ul public gratuit ANAF**, la înregistrarea unei firme: nume, adresă, stare de înregistrare, statut de plătitor de TVA, plus cifra de afaceri și numărul de angajați din bilanțul anual (cu întârzierea inerentă de un an a bilanțurilor).

---

## 5. Autentificare și sesiuni

- Supabase Auth, cu sesiunea păstrată prin cookie-uri HTTP (pattern SSR standard, prin pachetul `@supabase/ssr`).
- **Cloudflare Turnstile** pe formularele de înregistrare și login — Supabase verifică el însuși token-ul cu Cloudflare, nu există cod propriu de verificare server-side.
- **Gap cunoscut**: există un helper de middleware pentru reîmprospătarea automată a sesiunii, dar nu e conectat printr-un fișier `middleware.ts` la rădăcina proiectului (vezi tabelul de gap-uri de mai sus).

---

## 6. Securitate — rezumat

- **Autorizare pe două niveluri** (defense in depth): verificare explicită în fiecare rută API, plus RLS la nivelul bazei de date.
- **Escaladare de privilegii** (user obișnuit → admin): blocată la nivel de bază de date printr-un trigger dedicat (vezi audit, punctul 1).
- **Secrete**: cheia `service_role` există doar în variabile de mediu server-side; nu ajunge niciodată la client.
- **HTTPS**: gestionat automat de Railway.
- **Bot/spam protection**: Cloudflare Turnstile la autentificare.
- **Date personale protejate**: telefonul și emailul unei firme vizibile doar membrilor autentificați și verificați de administrator.
- **Fără teste automate** și **fără rate-limiting propriu** — gap-uri cunoscute, disponibile mai sus.

---

## 7. Deployment

- Flux: `git push` → Railway detectează schimbarea → rulează `next build` → deploy automat.
- Schimbările de bază de date (migrările SQL) se rulează **separat**, manual, în Supabase SQL Editor — nu fac parte (încă) din pipeline-ul automat de deploy.

---

## 8. Ce ar întreba probabil un IT-ist, pe scurt

| Întrebare | Răspuns |
|---|---|
| Unde rulează logica de business? | În Next.js (API routes), server-side |
| Cine impune regulile de acces? | Dublu: cod + RLS în Postgres |
| Se poate ocoli RLS-ul din browser? | Nu — cheia care ocolește RLS (`service_role`) nu ajunge niciodată la client |
| S-a găsit vreo vulnerabilitate reală? | Da, una critică (escaladare la admin) — găsită și reparată în timpul acestui audit, vezi secțiunea 0 |
| Există audit trail? | Da, parțial — tabel `admin_audit_log` pentru acțiuni administrative |
| Există teste automate? | Nu, momentan |
| Cum se aplică schimbările de schemă? | Manual, prin fișiere SQL numerotate, rulate în Supabase |
| Ce se întâmplă dacă un cont e șters? | Cascadă controlată prin `ON DELETE` — datele asociate se șterg sau se anonimizează (`SET NULL`), nu rămân orfane |
| Cum se previn conturile automate/bot? | Cloudflare Turnstile la înregistrare și login |
