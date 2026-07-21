# Actualizare 3 — Cont personal separat de firmă + corecturi din testarea video

## 1. Migrație nouă de rulat (după 0025)

`supabase/migrations/0026_personal_support_needed.sql` — adaugă un câmp
personal nou (`cauta_suport`) și recreează vederea `member_directory` ca să-l
includă.

## 2. Schimbarea majoră: înregistrarea nu mai cere o firmă

**Înainte:** un singur flux — cont + firmă, obligatoriu, în aceeași secvență.
**Acum:**

- **`/inregistrare`** — doar contul personal (nume, telefon, email, parolă).
  La final, alegi: "Adaugă firma acum" sau "Continuă fără firmă".
- **`/inregistrare/firma`** — flux separat, doar pentru firmă (CUI → Detalii
  → Domenii → Nevoi), accesibil oricând din Dashboard ("Adaugă o firmă") sau
  din orice loc din aplicație unde apare acest CTA.

**Ce poți face fără firmă:** Știri, Evenimente (inclusiv înscriere), Membri,
Mesaje — toate funcționează doar pe baza contului personal, confirmat
structural (nu depind nicăieri de `owns_company`).

**Ce tot cere firmă:** postarea și răspunsul la Oportunități, lăsarea de
recenzii, cererile de ofertă. Pagina de postare oportunitate (`/oportunitati/noua`)
arată acum clar, din start, dacă nu ești logat sau nu ai firmă — nu mai afli
abia la trimitere.

## 3. Corecturi din testarea video (transcript-ul primit)

Am ascultat testul cuvânt cu cuvânt. Ce am reparat:

- **Bug real: "Acest membru nu mai este disponibil"** — nu era o problemă de
  date; verificarea profilului țintă la trimiterea unui mesaj folosea
  clientul obișnuit, blocat de regula de securitate care restricționează
  `profiles` la conexiuni acceptate. Mesageria trebuie să fie deschisă între
  orice membri, deci am reparat verificarea să ocolească acea regulă.
- **Search pe domenii de activitate** la înregistrarea firmei — lipsea,
  acum e primul lucru din pasul "Domenii".
- **"Selectează tot"** pentru județele suplimentare deservite.
- **Scroll sus automat** la fiecare "Continuă" din formularul de firmă — nu
  mai rămâi jos, unde erai pe pasul anterior.
- **Câmp personal nou: "La ce ajutor ai nevoie din partea comunității?"** —
  în `/dashboard/profil`, separat de nevoile firmei (care rămân neschimbate
  la înregistrarea firmei). Apare pe profilul public de membru, într-un
  chenar vizibil, plus un mic indicator "caută ajutor" pe cardul din listă,
  și e inclus în căutarea din `/membri`. Ideea vine direct din transcript:
  "eu caut nu doar ce vinde firma... la ce are nevoie de ajutor persoana".
- **Pagina principală** — secțiune nouă de navigare rapidă (Firme, Membri,
  Oportunități, Evenimente, Știri) imediat sub hero, ca răspuns la "ar
  trebui să fie pe pagina principală categoriile principale".

## 4. Ce am lăsat deliberat neatins (și de ce)

- **Compararea domeniilor cu aplicația AER** — am nevoie de lista lor exactă
  de categorii ca să pot face o comparație corectă; spuneți-mi dacă aveți
  acces la ea.
- **"Cache"-ul la butonul Back al browser-ului** — în interiorul unui
  formular cu mai mulți pași (ex: cei 4 pași ai firmei), pasul curent e ținut
  în memoria paginii, nu în URL, deci butonul Back al browserului tot iese
  din pagină, nu te duce la pasul anterior (asta e neschimbat față de
  înainte). Fiecare pas are propriul buton "Înapoi" din formular, care
  funcționează corect. Rezolvarea completă (pași reflectați în URL) e un
  refactor mai mare — spuneți-mi dacă vreți să-l fac.
- **Un câmp de tip "puncte forte" cu chip-uri predefinite + search + opțiune
  liberă** (stil LinkedIn) la nevoile firmei — cele existente (`Select` +
  câmp liber) rămân funcționale, dar nu sunt tag-uri cu search; e un
  upgrade de UI mai mare, îl las pentru o rundă viitoare dacă îl vreți.

## 5. Titlu nou + experiență de aplicație pe telefon (runda curentă)

- **Hero nou pe pagina principală:** titlu mare "**Antreprenori Creștini** din
  România" (primul rând cu gradientul brandului), eticheta de deasupra
  "Comunitatea Antreprenorilor Creștini", și un subtitlu care vorbește direct
  membrilor grupului de Facebook "Antreprenori Creștini": comunitatea unde
  antreprenorii cu aceleași valori se găsesc unii pe alții, colaborează și
  cresc împreună. Tradus și în engleză.
- **Bara de navigare de jos, pe mobil** (stil aplicația AER): Acasă · Firme ·
  Membri · Mesaje · Cont — fixă, mereu vizibilă, cu tab-ul activ evidențiat.
  Prioritatea cerută (să se găsească și să vorbească ușor unii cu alții) e
  mereu la un deget distanță. Pe desktop nu apare (rămâne meniul de sus).
- **Instalabil ca aplicație (PWA):** site-ul are acum manifest + iconițe
  (192/512 + Apple touch icon, generate din siglă). Pe telefon, din meniul
  browserului → "Adaugă pe ecranul de start" → se deschide pe tot ecranul,
  fără bara de browser, cu iconița comunității — practic ca o aplicație.
  Nu necesită nimic în App Store / Play Store și niciun pas de instalare pe
  server (Railway îl servește automat).
