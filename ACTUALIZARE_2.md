# Actualizare 2 — Căutare, galerie firmă, arhivare, mesaje, oportunități, EN

Continuarea lui `ACTUALIZARE_REVAMP.md`. La fel: rulezi migrațiile noi în
Supabase SQL Editor, în ordine, apoi `git push`.

---

## 1. Migrații noi de rulat (în ordine, după 0021)

1. `supabase/migrations/0022_company_description_gallery.sql` — galerie foto la descrierea firmei
2. `supabase/migrations/0023_rfq_deal_archiving.sql` — arhivare Cereri de ofertă / Înțelegeri
3. `supabase/migrations/0024_conversation_leave_policy.sql` — politică lipsă pentru ștergerea unei conversații
4. `supabase/migrations/0025_opportunity_image.sql` — imagine opțională la Oportunități

## 2. Ce s-a schimbat

- **Catalog** — căutarea din bara de sus caută acum și în descrierea firmei, și
  în numele domeniului (categoriei), nu doar în denumire.
- **Descrierea firmei** (`/dashboard/firma/[id]/edit`) — poți adăuga o mică
  galerie foto lângă textul de descriere (folosește bucket-ul `company-media`
  existent, niciun bucket nou).
- **Mesaje** — buton de **Export** (descarcă conversația ca `.txt`) și buton
  de **Delete** (elimină conversația din lista ta; celălalt membru o
  păstrează pe a lui — nu e o ștergere reciprocă).
- **Firmă** — ștergerea definitivă exista deja (`/dashboard/firma/[id]/edit`,
  buton roșu "Șterge firma definitiv") — nu am schimbat nimic acolo.
- **Cereri de ofertă / Înțelegeri** — în loc de ștergere (ambele implică două
  firme), am adăugat **arhivare**: buton pe fiecare card din Dashboard +
  link "Arată arhivate" / "Arată active" în capul fiecărei secțiuni.
- **Oportunități** — imagine opțională la postare, cu recomandare de
  dimensiune (1200×675px, sub 5MB) afișată explicit ca opțională. Pe pagina
  de detaliu, oricine (nu doar cel care răspunde) vede acum direct un buton
  **"Trimite mesaj"** către firma care a postat oportunitatea.

## 3. Traducerea în engleză (EN) — ce acoperă și ce nu

Limba se schimbă din meniul de setări (din Header) și acum funcționează prin
cookie, nu doar prin localStorage — de asta paginile "de server" (majoritatea
site-ului) pot afișa direct conținutul în limba corectă, nu doar meniul.

**Traduse complet:** Header, Footer, pagina principală, Catalog (inclusiv
căutarea), Știri, Evenimente (inclusiv înscrierea la eveniment), Membri,
Mesaje, Oportunități (listă, detaliu, formular de postare, formular de
răspuns).

**Rămân doar în română** (o decizie deliberată, ca să nu extindem la
nesfârșit acest răspuns): Dashboard-ul intern (Cererile de ofertă,
Înțelegerile, editarea firmei), panourile de Admin, fluxul de Înregistrare,
și paginile legale (Termeni, Regulament, Confidențialitate). Sunt unelte
folosite de proprietarii de firme care operează platforma, nu conținut
public — dar dacă le vreți traduse și pe acestea, spuneți-mi și le fac
într-o rundă separată.

**Cum funcționează tehnic**, dacă vreți să continuați traducerea singuri:
- `src/lib/i18n/translations.ts` — dicționarul (chei RO/EN)
- `src/lib/i18n/server.ts` — `getT()`, pentru pagini de server (`async
  function ... { const { t } = await getT(); }`)
- `src/lib/settings/context.tsx` — `useSettings()`, pentru componente client
  (`"use client"`, `const { t } = useSettings();`)
