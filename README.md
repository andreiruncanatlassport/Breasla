# Breasla — registrul antreprenorilor din România

Un catalog de firme verificate prin ANAF, organizat pe domenii și zone, ca să găsești rapid
subcontractanți/colaboratori de încredere.

Acest README e scris pentru cineva cu **zero experiență de cod**. Urmează pașii în ordine — nu
sări peste niciunul. Îți ia cam 30-45 de minute prima dată.

> Numele platformei e **Breasla** (domeniul recomandat: `breasla.ro`). Dacă vreți totuși să-l
> schimbați mai târziu, vezi secțiunea [Schimbarea numelui](#schimbarea-numelui) de la final —
> durează 5 minute.

---

## 1. Ce ai construit (pe scurt)

- **Înregistrare firmă** cu autocompletare din ANAF pe baza CUI (denumire, adresă, județ,
  localitate, status TVA, cod CAEN, stare de înregistrare).
- **Aprobare semi-automată**: dacă CUI-ul e activ la ANAF, firma apare instant în catalog; altfel
  intră în verificare manuală de admin.
- **Cifră de afaceri preluată automat** din bilanțurile publice ANAF, cu variantă manuală de
  rezervă dacă nu există bilanț (firme noi).
- **Catalog căutabil**: după nume, domeniu de activitate, județ, și rază geografică din jurul unei
  adrese (calculată din sediul fiecărei firme).
- **Taxonomie proprie de domenii** (20 categorii, ~90 subcategorii) mapată pe coduri CAEN,
  editabilă din panoul de admin.
- **Date personale private**: numele și contactul personal al reprezentantului sunt vizibile doar
  firmelor cu care se acceptă o conexiune — nu public.
- **Conexiuni între firme** (cerere → acceptare/refuz), bază pentru mesageria din Faza 2.
- **Profil de firmă bogat**: banner + avatar, rețele sociale, etichete/specializări, mai multe
  persoane de contact pe departamente.
- **Portofoliu ("Lucrări")**: fiecare firmă poate posta proiecte, fiecare cu propria pagină publică
  și galerie foto.
- **Recenzii între firme**, aprobate manual de admin pe baza unei dovezi de colaborare
  (contract, comandă etc.), afișate ca rating mediu pe profil.
- **Firme salvate (favorite)**, notificări pentru cereri de conexiune, contor de vizualizări,
  cod QR + link rapid de distribuit pentru fiecare profil.
- **Rating mediu și timp de răspuns** vizibile direct în catalog, nu doar pe profil.
- **Verificare email proprie, opțională și neblocantă**: contul e activ imediat; un banner roșu
  "Neverificat" în Dashboard permite verificarea printr-un cod, când dorește utilizatorul.
- **Termeni & Condiții, Regulament, și Politică de confidențialitate (GDPR)**, cu bifă
  obligatorie la înregistrare — data acceptului rămâne înregistrată pe cont.
- **Design propriu, expresiv**: paletă navy + sigiliu auriu, mesh gradients, blocuri delimitate
  prin elevație (text ridicat vs. inputuri adâncite), semn de brand desenat de la zero, mod
  întunecat complet. Font modern ("Geist"), găzduit local.
- **Ștergere firmă de către proprietar**, iar orice editare/ștergere cere reconfirmarea emailului
  (cod trimis prin email) înainte de a fi permisă.
- **Panou de admin**: aprobare/respingere manuală, moderare recenzii, statistici de bază,
  gestionare categorii/CAEN.
- **Panou de setări** (nu doar un buton RO/EN): limbă, temă deschisă/întunecată, font, mărime text
  — toate salvate pentru vizitele viitoare.
- **Design modern, cu suport complet dark/light mode**, responsive pe mobil/tabletă/desktop.

### Ce NU e construit încă (rezervat pentru pași următori)

- **Chat în platformă** — tabelele din bază de date (`messages`) și politicile de securitate sunt
  deja pregătite; lipsește doar interfața.
- **Notificări prin email** (ex: "ai o cerere de conexiune nouă") — necesită un provider extern de
  email (vezi secțiunea 6.1 despre limitele emailului de test al Supabase).
- **Taxonomia CAEN completă** — am pornit cu coduri la nivel de diviziune (2 cifre), alese cu
  încredere ridicată, ca punct de plecare funcțional. Le poți rafina din Admin → Categorii pe
  măsură ce vezi ce firme se înregistrează.

---

## 2. Ce conturi îți trebuie (toate au nivel gratuit)

1. **[Supabase](https://supabase.com)** — baza de date + autentificare
2. **[GitHub](https://github.com)** — unde stă codul
3. **[Railway](https://railway.app)** — unde rulează aplicația, live

---

## 3. Pasul 1 — Creează proiectul Supabase

1. Intră pe [supabase.com](https://supabase.com) → **New project**.
2. Alege un nume (ex: `breasla`), o parolă puternică pentru baza de date (salveaz-o undeva sigur)
   și o regiune apropiată de România (ex: `eu-central-1`, Frankfurt).
3. Așteaptă 1-2 minute până se creează proiectul.

### 3.1 Activează extensia PostGIS (pentru căutarea pe rază geografică)

1. În meniul din stânga: **Database** → **Extensions**.
2. Caută `postgis` și activeaz-o (buton toggle).

### 3.2 Rulează migrațiile (schema bazei de date)

Cel mai simplu e cu **un singur tab**, reutilizat de 5 ori — nu deschide 5 taburi separate, ca să
nu se piardă ordinea în care le rulezi (ordinea de **rulare** contează, nu ordinea de deschidere).

1. În meniul din stânga: **SQL Editor** → **New query** (un singur tab e suficient).
2. Deschide fișierul `supabase/migrations/0001_schema.sql` din acest proiect, pe calculatorul tău,
   selectează tot conținutul și copiază-l (Ctrl+A, Ctrl+C).
3. În tab-ul din Supabase, lipește conținutul și apasă **Run** (sau Ctrl+Enter).
4. **Așteaptă mesajul de succes** înainte să continui ("Success. No rows returned" sau similar). Dacă
   vezi o eroare, oprește-te aici și verifică mesajul — nu trece la fișierul următor.
5. Șterge tot conținutul din tab (Ctrl+A, Delete), lipește conținutul lui `0002_rls.sql`, Run,
   așteaptă succesul.
6. Repetă identic, **în ordine**, pentru `0003_seed_judete.sql`, `0004_seed_categories.sql`,
   `0005_search_function.sql`, `0006_profile_reviews_reauth.sql`, `0007_storage.sql`,
   `0008_rating_response_time.sql`, `0009_terms_acceptance.sql`, și
   `0010_email_verification.sql`. Fiecare fișier depinde de cel dinainte.
7. Dacă un fișier dă eroare, cel mai probabil ai sărit un pas sau ai rulat fișierele într-o altă
   ordine. Verifică în **Table Editor** dacă tabelele așteptate există deja; dacă nu, reia de la
   0001.

> **Eroare frecventă:** `type "geography" does not exist` la rularea lui `0005` înseamnă că
> `0001_schema.sql` nu a rulat cu succes încă (el e cel care activează extensia PostGIS și
> creează acest tip). Verifică în Table Editor dacă există deja tabelul `companies` — dacă nu,
> întoarce-te la pasul 1 și rulează `0001` primul, așteptând mesajul de succes.

### 3.3 Verifică bucket-urile de fișiere (poze, dovezi de recenzii)

Fișierul `0007_storage.sql` a creat automat două "bucket"-uri de stocare. Verifică rapid:
1. Meniul din stânga → **Storage**.
2. Ar trebui să vezi `company-media` (public — poze de profil, portofoliu) și `review-proofs`
   (privat — dovezi de colaborare pentru recenzii). Dacă lipsesc, rulează din nou
   `0007_storage.sql`.

### 3.4 Ia cheile API

1. **Project Settings** (iconița de rotiță) → **API**.
2. Notează-ți trei valori — o să le folosești în pasul 5:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon / public key**
   - **service_role key** (secretă — nu o pune niciodată în cod vizibil public sau în browser)

### 3.5 Setări de autentificare (email)

1. **Authentication** → **Sign In / Providers** → **Email** → comutatorul **"Confirm email"**
   → setează-l pe **OFF** → **Save**.

   > ⚠️ **Atenție la confuzie:** în **Authentication → Emails → Templates** există un element numit
   > "Confirm sign up" — acela e doar *șablonul de email*, nu comutatorul. Comutatorul real e cel
   > de mai sus, la Providers → Email.

2. **De ce OFF:** aplicația are propriul sistem de verificare a emailului, opțional și neblocant —
   contul e activ imediat după înregistrare, iar în Dashboard apare un banner roșu
   **"Neverificat"** cu buton de verificare (cod pe email). Dacă lași "Confirm email" activat,
   înregistrarea firmei se întrerupe la mijloc: utilizatorul e obligat să iasă din formular, să
   deschidă emailul și să se autentifice din nou înainte să continue.

3. **Authentication** → **URL Configuration**: aici vei reveni la Pasul 5.5, după ce ai domeniul de
   pe Railway.

#### 3.5.1 Activează codul din 6 cifre (necesar pentru verificări)

Două funcții trimit un cod pe email: **verificarea opțională a emailului** (bannerul roșu din
Dashboard) și **reconfirmarea identității** înainte de a edita/șterge o firmă. Supabase trimite
implicit un link, nu un cod — trebuie să adaugi explicit codul în șablon:

1. **Authentication** → **Email Templates** → **Magic Link**.
2. În conținutul HTML, adaugă variabila `{{ .Token }}` — de exemplu:
   ```html
   <h2>Codul tău de confirmare</h2>
   <p>Introdu acest cod în Breasla: <strong>{{ .Token }}</strong></p>
   <p>Expiră în câteva minute.</p>
   ```
3. Salvează. Testează din aplicație (Dashboard → butonul "Verifică acum" din bannerul roșu).

> **Notă:** dacă vezi mesajul "Set up custom SMTP to edit templates" în Supabase, va trebui să
> configurezi întâi un furnizor SMTP propriu (vezi 3.5.2) ca să poți edita șablonul.

#### 3.5.2 Atenție la limita emailului de test din Supabase

Fără un furnizor de email propriu, Supabase folosește un serviciu de test cu limită foarte mică
(câteva emailuri/oră) — suficient să testezi, insuficient pentru utilizare reală cu 400-500 de
firme. Pentru lansare, configurează un furnizor SMTP propriu din **Project Settings → Auth →
SMTP Settings** — de exemplu [Resend](https://resend.com) are un nivel gratuit generos și se
configurează în câteva minute.

---

## 4. Pasul 2 — Pune codul pe GitHub

Din folderul proiectului (unde ai descărcat acest cod), în terminal:

```bash
git init
git add .
git commit -m "Primul commit — Breasla"
```

Apoi, pe [github.com](https://github.com), creează un repository nou (gol, fără README), și
rulează comenzile pe care ți le arată GitHub după creare — ceva de forma:

```bash
git remote add origin https://github.com/NUMELE-TAU/NUMELE-REPO.git
git branch -M main
git push -u origin main
```

---

## 5. Pasul 3 — Deploy pe Railway

1. Pe [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → alege
   repository-ul de la pasul anterior.
2. Railway detectează automat că e o aplicație Next.js și configurează build-ul singur.
3. Intră în proiectul creat → tab-ul **Variables** → adaugă exact aceste 4 variabile (valorile
   sunt cele notate la Pasul 3.3):

   | Nume variabilă | Valoare |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL de la Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/public key de la Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key de la Supabase |
   | `NEXT_PUBLIC_SITE_URL` | domeniul tău de Railway (vezi 5.4) |

### 5.4 Ia domeniul public

1. În Railway, tab-ul **Settings** al serviciului → **Networking** → **Generate Domain**.
2. Copiază adresa generată (ceva de forma `https://numele-tau.up.railway.app`).
3. Pune-o ca valoare pentru `NEXT_PUBLIC_SITE_URL` în Variables (fără `/` la final), apoi
   redeploy (Railway o face automat la schimbarea unei variabile).

### 5.5 Conectează domeniul înapoi în Supabase

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL**: pune adresa de Railway.
3. **Redirect URLs**: adaugă aceeași adresă (+ `/**` la final, ex:
   `https://numele-tau.up.railway.app/**`).

---

## 6. Pasul 4 — Fă-ți cont de admin

1. Deschide aplicația (adresa de Railway) → **Autentificare** → înregistrează-te normal, ca orice
   utilizator (poți face asta din pagina de "Înregistrează-ți firma", pasul "Cont").
2. În Supabase → **SQL Editor**, rulează (înlocuiește cu emailul tău):

```sql
update public.profiles
set rol = 'admin'
where email_personal = 'emailul-tau@exemplu.ro';
```

3. Reintră în aplicație (delogare + login) — acum vezi link-ul **Administrare** în meniu.
4. De acolo poți promova și alți moderatori, rulând aceeași comandă cu `rol = 'moderator'` pentru
   emailul lor, după ce și-au făcut cont.

---

## 7. Testează tot fluxul

1. Înregistrează o firmă reală (a ta, sau orice CUI activ pe care îl știi) și verifică:
   - se preiau corect datele de la ANAF;
   - apare status "Verificată" dacă firma e activă, sau "În verificare" dacă nu;
   - firma apare în `/catalog`.
2. Din alt cont (sau incognito), încearcă să trimiți o cerere de conexiune firmei tale și
   acceptă/refuză din `/dashboard`.
3. Din `/admin`, verifică statisticile și lista de aprobare manuală.

---

## 8. Administrarea categoriilor și codurilor CAEN

Din **Administrare → Categorii & CAEN** poți adăuga sau elimina coduri CAEN pentru fiecare
categorie/subcategorie. Taxonomia de start conține coduri la nivel de diviziune (2 cifre) —
suficient de bune ca punct de start, dar merită rafinate pe măsură ce vezi ce firme se
înregistrează (ex: adaugă `6201` specific "activități de realizare a soft-ului la comandă" la
subcategoria de dezvoltare software, în loc de doar diviziunea generică `62`).

Reține că România e în tranziție de la codurile **CAEN Rev.2** la **CAEN Rev.3** (termen limită
oficial: 25 septembrie 2026) — de-asta formularul de adăugare are un selector de versiune.

---

## 9. Limitări cunoscute, de avut în vedere

- **Geocodarea adresei** (pentru căutarea pe rază) folosește serviciul gratuit OpenStreetMap
  Nominatim, limitat la ~1 cerere/secundă. Perfect pentru câteva sute de firme; dacă platforma
  crește mult, ia în calcul un provider plătit (ex. Google Geocoding API).
- **API-ul ANAF** nu are un SLA garantat — uneori răspunde mai lent sau pică temporar. Formularul
  de înregistrare are deja mesaje de eroare clare pentru acest caz ("încearcă din nou").
- Cifra de afaceri auto-preluată reflectă ultimul bilanț public depus, care poate avea 6-12 luni
  vechime — normal, așa funcționează sursa (ANAF/Ministerul Finanțelor).

---

## 10. Rularea locală (opțional, pentru testare pe calculatorul tău)

```bash
npm install
cp .env.example .env.local   # apoi completează valorile reale
npm run dev
```

Deschide `http://localhost:3000`.

---

## 11. Schimbarea numelui

Numele "Breasla" apare în 3 locuri ușor de găsit și schimbat, dacă vreți vreodată alt nume:

1. `src/app/layout.tsx` — `title` din `metadata`.
2. `src/components/Header.tsx` — textul de lângă logo.
3. `src/components/Footer.tsx` — textul din footer.

Culoarea și stilul (navy + auriu, tema de "registru oficial + ștampilă") sunt definite central în
`src/app/globals.css`, dacă vreți să le ajustați ulterior.

---

## 12. Structura proiectului (pentru orientare rapidă)

```
supabase/migrations/     schema bazei de date, de rulat în Supabase SQL Editor
src/app/                 paginile aplicației (Next.js App Router)
src/app/api/             logica de server (ANAF, geocodare, conexiuni, admin)
src/components/          componente reutilizabile de UI
src/lib/                 integrare Supabase, ANAF, geocodare, traduceri
src/types/database.ts    tipurile de date (oglindesc schema SQL)
```
