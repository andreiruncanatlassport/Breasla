# Actualizare 6 — cod de 6 cifre în emailul de verificare

## De ce apărea un link în loc de cod

Codul `verifyOtp({..., type: "email"})` din `src/app/api/verificare-email/confirma/route.ts`
și `src/app/api/reauth/verify/route.ts` așteaptă deja un cod de 6 cifre — partea de cod e
corectă și nu a fost modificată.

Emailul în sine însă **nu e generat de codul din acest repo**. Când chemi
`supabase.auth.signInWithOtp(...)`, Supabase trimite automat un email folosind
șablonul „Magic Link / OTP" configurat în Dashboard-ul proiectului, care implicit
conține un buton/link (`{{ .ConfirmationURL }}`), nu codul (`{{ .Token }}`).
Asta nu se schimbă din git — se schimbă din Supabase Dashboard.

## Ce trebuie făcut (o singură dată, în Dashboard)

1. Deschide proiectul Supabase → **Authentication → Email Templates**.
2. Selectează șablonul **„Magic Link"** (uneori afișat ca „Magic Link or OTP").
3. Înlocuiește conținutul cu ceva de genul celui de mai jos, care afișează
   `{{ .Token }}` (codul de 6 cifre) în loc de link.
4. Salvează. De acum, orice `signInWithOtp` (verificare email + reautentificare
   pentru acțiuni sensibile) va trimite codul, nu link-ul.

Nu e nevoie de nicio schimbare de cod în acest repo — comportamentul din site
(inputul de „Cod din 6 cifre") era deja construit pentru codul din OTP.

### Șablon HTML sugerat (potrivit cu stilul ACDR)

```html
<!doctype html>
<html lang="ro">
  <body style="margin:0;padding:24px;background:#f6f6f4;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e6e5e0;border-radius:16px;overflow:hidden;">
      <tr><td style="height:4px;background:linear-gradient(90deg,#f0722a,#d85f1b);"></td></tr>
      <tr><td style="padding:28px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#f0722a;font-weight:600;">ACDR</p>
        <h1 style="margin:0 0 16px;font-size:20px;color:#101828;">Codul tău de confirmare</h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475467;">
          Introdu codul de mai jos pe pagina unde ți-a fost cerut. Expiră în scurt timp din motive de siguranță.
        </p>
        <p style="margin:0 0 20px;font-size:32px;letter-spacing:8px;font-weight:700;color:#0a2540;">{{ .Token }}</p>
        <p style="margin:0;font-size:12px;color:#98a2b3;">
          Dacă nu ai cerut tu acest cod, poți ignora acest email.
        </p>
      </td></tr>
    </table>
  </body>
</html>
```

### Unde se aplică

Acest șablon acoperă ambele fluxuri care folosesc `signInWithOtp` + `verifyOtp`:

- verificarea emailului din cont (`src/components/EmailUnverifiedBanner.tsx`)
- reautentificarea pentru acțiuni sensibile (`src/app/api/reauth/*`)

Dacă vrei coduri separate vizual pentru cele două fluxuri, Supabase nu oferă
în acest moment șabloane diferite per „scop" pentru `signInWithOtp` — e același
șablon „Magic Link" pentru toate apelurile de tip OTP email.
