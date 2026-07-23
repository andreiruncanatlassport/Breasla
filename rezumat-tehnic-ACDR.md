# Rezumat tehnic — Platforma ACDR (Antreprenori Creștini din România)

*Document de referință pentru discuții cu experți IT.*

## 1. Stack, pe scurt

| Strat | Tehnologie |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript peste tot (strict mode) |
| Stilizare | Tailwind CSS v4 |
| Backend | Fără server separat — logica de backend trăiește în același proiect Next.js, ca API routes (Route Handlers) |
| Bază de date | PostgreSQL, găzduit de Supabase |
| Autentificare | Supabase Auth (email + parolă) |
| Fișiere / imagini | Supabase Storage |
| Găzduire | Railway |
| Cod sursă | Git |

Nu e un stack exotic — e o alegere comună pentru acest tip de aplicație (marketplace/comunitate cu conturi, căutare, upload de imagini): un singur framework full-stack (Next.js) peste o platformă de backend-as-a-service (Supabase), fără server propriu de administrat.

---

## 2. Front-end

- **React 19 + Next.js App Router** — fiecare pagină e implicit un *Server Component* (randat pe server, HTML gata construit trimis la client — bun pentru SEO și încărcare rapidă). Componentele interactive (formulare, butoane cu stare) sunt marcate explicit `"use client"`.
- **Tailwind CSS v4**, cu un mic sistem de design intern (culori, umbre, radius — definite ca variabile CSS, nu hardcodate).
- Fără Redux sau alt state-management extern — starea e locală (React `useState`) sau vine direct din date randate pe server.
- **PWA** (Progressive Web App): are `manifest.ts`, iconițe dedicate, și un banner de "adaugă pe ecranul principal" — aplicația se poate instala pe telefon (prompt nativ pe Android/Chrome; instrucțiuni manuale pe iOS, din cauza limitării proprii Apple acolo — nicio aplicație web nu poate declanșa automat instalarea pe iOS).
- ~16 secțiuni principale de pagini (catalog firme, oportunități, știri, evenimente, dashboard membru, panou de administrare etc.) și ~39 de rute API.

---

## 3. Back-end (API routes)

- Fiecare rută API e un fișier `route.ts`, cu funcții `GET` / `POST` / `PATCH` / `DELETE` separate, care rulează **doar pe server** — codul lor nu ajunge niciodată în bundle-ul trimis către browser.
- Fiecare rută care modifică date verifică explicit identitatea și rolul userului (`supabase.auth.getUser()`) înainte de orice operațiune.
- Validarea datelor de intrare e făcută manual, în fiecare rută. *(Notă: `zod` și `react-hook-form` sunt listate ca dependențe în proiect, dar nu sunt folosite nicăieri momentan — sunt candidați buni pentru curățare sau pentru adoptare reală mai târziu.)*

---

## 4. Baza de date — securitatea, în detaliu

Acesta e cel mai solid aspect tehnic al proiectului:

- **~36 de migrări SQL** versionate în git — fiecare schimbare de schemă e un fișier `.sql` numerotat secvențial. Aplicarea lor în Supabase (SQL Editor) e momentan un pas **manual**, separat de deploy-ul automat al codului.
- **Row Level Security (RLS) activă pe toate tabelele sensibile — peste 119 politici RLS** scrise explicit. Regulile de acces ("cine poate citi/scrie ce rând, în ce condiții") sunt impuse **la nivelul bazei de date**, nu doar în codul aplicației. Chiar dacă ar exista o gaură în logica din Next.js, baza de date tot ar refuza accesul neautorizat direct.
- **Două tipuri de client Supabase**, folosite deliberat diferit:
  - clientul normal (`anon key`) — respectă RLS; folosit peste tot unde acționează un utilizator obișnuit.
  - clientul `service_role` — ocolește RLS complet; folosit **strict** în rute server-side pentru operațiuni administrative (ștergere definitivă de cont, aprobare firmă etc.) — cheia lui nu e niciodată expusă către browser.
- **Triggere de protecție la nivel de coloană** — câteva câmpuri sensibile (ex: dacă emailul e verificat, dacă un cont e verificat de admin, statusul unei oportunități) au triggere PostgreSQL care resping orice modificare venită de la altcineva decât admin sau service-role — chiar dacă cineva ar încerca un update direct din browser, ocolind interfața. RLS obișnuit nu poate restricționa coloană-cu-coloană într-un singur rând; triggerele astea acoperă exact acel gol.
- **Verificare CUI prin API-ul public gratuit ANAF**, la înregistrarea unei firme: nume, adresă, stare de înregistrare, statut de plătitor de TVA. Există și o a doua integrare, cu endpoint-ul separat de bilanț ANAF (`/bilant`), care aduce cifra de afaceri, profitul net și numărul mediu de salariați din bilanțul anual depus (cu întârzierea inerentă de aproximativ un an a bilanțurilor).

---

## 5. Autentificare și sesiuni

- Supabase Auth, cu sesiunea păstrată prin cookie-uri HTTP (pattern SSR standard, prin pachetul `@supabase/ssr`).
- **De reținut ca gap cunoscut**: există un helper de middleware pentru reîmprospătarea automată a sesiunii (`updateSession`), dar acesta **nu e conectat** printr-un fișier `middleware.ts` la rădăcina proiectului. Reîmprospătarea sesiunii se întâmplă reactiv, per-cerere, nu proactiv la nivel centralizat. Nu e o gaură de securitate, dar e o piesă de cod scrisă și nefolosită — merită fie conectată, fie eliminată.

---

## 6. Securitate — rezumat

- **Autorizare pe două niveluri** (defense in depth): verificare explicită în fiecare rută API, plus RLS la nivelul bazei de date.
- **Secrete**: cheia `service_role` (acces total la bază de date) există doar în variabile de mediu server-side; nu ajunge niciodată la client.
- **HTTPS**: gestionat automat de Railway.
- **Date personale protejate**: telefonul și emailul unei firme nu mai sunt vizibile public — doar membrilor autentificați și verificați de administrator.
- **Fără teste automate** (unit/integration) — de menționat onest, nu există încă o suită de teste.
- **Fără rate-limiting propriu** pentru rutele API — se bazează pe limitele implicite ale Supabase și Railway.

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
| Există audit trail? | Da, parțial — tabel `admin_audit_log` pentru acțiuni administrative |
| Există teste automate? | Nu, momentan |
| Cum se aplică schimbările de schemă? | Manual, prin fișiere SQL numerotate, rulate în Supabase |
| Ce se întâmplă dacă un cont e șters? | Cascadă controlată prin `ON DELETE` — majoritatea datelor asociate se șterg sau se anonimizează (`SET NULL`), nu rămân orfane |
