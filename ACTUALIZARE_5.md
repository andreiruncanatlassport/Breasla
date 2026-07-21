# Actualizare 5 — Focus pe colaborare: recomandări, insignă Verificat, admin puternic

## Migrație de rulat (după 0028)

`supabase/migrations/0029_member_recommendations.sql` — tabelul de recomandări
între membri + recrearea `member_directory` cu numărul de recomandări și
flagul "verificat". E scrisă **defensiv** (`add column if not exists` pentru
toate coloanele de profil folosite), deci e sigură de rulat chiar dacă vreo
migrație anterioară a fost sărită.

## 1. Simplificare — scos RFQ / contracte / înțelegeri

Conform deciziei: inima colaborării rămâne **mesaje + recenzii**. Am scos din
UI butonul "Cere ofertă" și tot ce ținea de oferte/contracte/înțelegeri.
Tabelele rămân în DB (goale), ca să nu pierdem nimic ireversibil.
**Oportunitățile rămân** — ele erau cerute păstrate.

## 2. Recomandări între membri + insigna "Verificat"

- Un membru poate recomanda alt membru **doar dacă au schimbat mesaje**
  (verificat direct în baza de date, nu doar în interfață).
- La **5+ recomandări** primite → insigna verde **"Verificat"**, vizibilă pe
  card, pe profil (lângă nume) și numărabilă în filtre.
- Buton "Recomandă" pe profilul membrului (apare doar dacă poți recomanda;
  altfel un mesaj discret "poți recomanda după ce schimbați mesaje").
- Membrii verificați apar primii în listă; filtru nou "Doar membri verificați".

## 3. Sugestii automate discrete (ghost text)

Bara de căutare de la Membri arată acum, pe măsură ce scrii, până la 5
sugestii de membri/firme care duc direct la profil — fără să forțeze ceva.
Poți naviga cu săgețile și Enter. (API nou: /api/sugestii.)

## 4. Panou de admin — revamp complet

- **Statistici** pe pagina principală de admin: membri (activi, noi în 7 zile),
  firme (aprobate, noi), mesaje (total + 7 zile), recomandări, membri
  verificați, oportunități deschise, evenimente, știri, plus un card "de
  verificat" (firme + recenzii în așteptare).
- **Hub de instrumente** — carduri clare către Firme, Membri, Recenzii, Știri,
  Evenimente, Categorii.
- **Acțiuni în masă**: export CSV pentru membri și pentru firme (cu diacritice
  corecte în Excel), din paginile respective.
- Moderația firmelor în verificare a rămas pe prima pagină, la îndemână.

## 5. Statistici pentru "succes" (întrebarea 9)

Toate semnalele de succes cerute sunt acum vizibile în panoul de admin:
mesaje inițiate, conversații, recomandări, membri verificați, oportunități.
