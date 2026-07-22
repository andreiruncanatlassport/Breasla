# Actualizare 4 — Profil obligatoriu, chip-uri, filtre membri, pas-cu-pas (inspirat din AER)

Ai trimis 10 capturi din aplicația AER — le-am folosit atât pentru poziționare
(bara de căutare, widget-ul "Completează-ți profilul" cu inel de progres,
câmpul LinkedIn separat de website) cât și pentru confirmarea taxonomiei
(20 de domenii principale, deja existente în platforma noastră).

## 1. Migrație de rulat (după 0027)

`supabase/migrations/0028_profil_complet_tags_suport.sql` — câmpuri noi pe
profil (județ, firmă declarată, LinkedIn, tag-uri de suport) + recreare
`member_directory` cu tot ce trebuie pentru căutare și filtrare avansată.

## 2. Profilul public — acum obligatoriu la înregistrare

Pasul de profil (după crearea contului) cere acum: **rol/titlu, firma la
care lucrezi, județ, localitate, despre tine** — toate obligatorii. Poza și
telefonul rămân singurele opționale, cum ai cerut. Nu mai există buton de
"sar peste acest pas".

Un detaliu important: **"firma la care lucrezi" e un câmp separat, declarat
liber** — nu aceeași firmă verificată prin ANAF din `companies`. Poți spune
la ce firmă lucrezi chiar dacă nu o înregistrezi (încă) oficial pe platformă.

## 3. Chip-uri predefinite + "Altele" (peste tot, cum ai cerut — "Amele")

Am construit o componentă reutilizabilă (`TagPicker`) cu căutare inclusă,
folosită în **3 locuri**, toate pe aceeași taxonomie de 20 de domenii
principale (cea deja existentă în catalog):

- Profilul personal — "La ce ajutor ai nevoie din partea comunității?"
- Firma — "De ce ajutor ai nevoie din partea grupului?"
- Firma — "În ce domenii poate ajuta firma ta pe alții?"

Fiecare are un chip fix "+ Altele" care deschide un câmp de text liber.

## 4. Pas-cu-pas — Back-ul browserului funcționează corect acum

Atât înregistrarea contului (cont → profil), cât și adăugarea unei firme
(CUI → Detalii → Domenii → Nevoi) au acum pasul reflectat în URL
(`?etapa=`, `?pas=`). Butonul Back al browserului te duce corect la pasul
anterior, cu datele completate păstrate — nu doar butonul "Înapoi" din
formular, cum era înainte.

## 5. Membri — toți apar, plus filtre dezvoltate

- **Căutare extinsă**: scrii "Sport" și caută în nume, firmă, titlu, oraș,
  despre tine, domeniul firmei (verificate) și în tag-urile de "caută ajutor
  la" — exact cum ai cerut.
- **Filtre**: județ, "Cu firmă" / "Fără firmă", și chip-uri "Caută ajutor la"
  (aceleași 20 de domenii). Toate combinabile, reflectate în URL.
- Confirmat: toți membrii înregistrați apar în listă (implicit vizibili).

## 6. Din pozele AER — două adăugiri directe

- **Widget "Completează-ți profilul"** pe pagina de cont — inel de progres
  cu procent, exact ca în AER, apare doar dacă mai lipsește ceva (poză,
  LinkedIn etc.) și dispare la 100%.
- **Câmp LinkedIn** separat de website, pe profilul personal (opțional),
  afișat pe profilul public.

## 7. Ce am lăsat neatins (mic, dar spun cinstit)

Pasul "Cum te identifici" din AER (Antreprenor / Manager-Profesie liberală /
Speaker-Invitat) nu l-am adăugat — platforma noastră nu are (încă) roluri
diferite de conținut pentru fiecare tip de membru, deci ar fi doar
cosmetic. Spune-mi dacă vrei să-l adăugăm cu sens (ex: speakerii apar
altfel la evenimente).
