# Dopolavoro 47 — Gestionale Squadra di Calcio

App web (PWA) della squadra: rosa, calendario, certificati medici, cassa e shop.
React 18 + Vite, database e login su Supabase, hosting su Vercel, notifiche push con OneSignal.

Online: https://gestionale-calcio-gamma.vercel.app

## Avvio in locale

```bash
npm install
npm run dev        # http://localhost:5173
```

Crea `.env.local` (non va su git):
```
VITE_SUPABASE_URL=https://<progetto>.supabase.co
VITE_SUPABASE_ANON_KEY=<chiave anon>
VITE_ONESIGNAL_APP_ID=<app id OneSignal>
```

## Variabili su Vercel

| Nome | Uso |
|------|-----|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | frontend e funzione `/api/notifica` |
| `VITE_ONESIGNAL_APP_ID` | frontend e funzione `/api/notifica` |
| `ONESIGNAL_API_KEY` | **solo server** (`api/notifica.js`). Mai con prefisso `VITE_`, altrimenti finisce nel browser |

Dopo ogni modifica alle variabili serve un Redeploy.

## Struttura

```
api/notifica.js            → invio notifiche OneSignal lato server (nuove registrazioni, eventi)
public/OneSignalSDKWorker.js → service worker OneSignal (deve restare alla radice)
supabase/*.sql             → modifiche al database già applicate (sicurezza, permesso certificati)
src/
  context/AuthContext.jsx  → login, ruolo e permessi
  notifiche.jsx            → collegamento dispositivo ↔ utente (OneSignal login + tag)
  components/              → Sidebar, Icona, BottoneNotifiche, ModalCertificato
  pages/                   → Login, NuovaPassword, Dashboard, Giocatori, Calendario, Shop, Finanze, Admin
```

## Registrazione e approvazione

1. Chi si registra parte come **giocatore non approvato** e vede solo "Account in attesa"
2. Gli admin ricevono una notifica push "Nuova registrazione"
3. Un admin approva l'utente dalla pagina **Admin**

Ruolo, approvazione, stato e permessi li può cambiare **solo un admin**: il blocco è anche nel database (trigger `proteggi_campi_profilo`).

## Ruoli

| | Giocatore | Dirigente | Cassiere | Presidente | Admin |
|---|:-:|:-:|:-:|:-:|:-:|
| Dashboard, rosa, calendario, ordini shop | ✅ | ✅ | ✅ | ✅ | ✅ |
| Creare/modificare eventi (notifica a tutti) | – | ✅ | ✅ | ✅ | ✅ |
| Modificare dati giocatori | – | – | ✅ | ✅ | ✅ |
| Vedere le finanze | – | ✅ | ✅ | ✅ | ✅ |
| Registrare entrate/uscite | – | – | ✅ | – | ✅ |
| Inserire certificati medici | – | con permesso* | – | – | ✅ |
| Prodotti shop, stato ordini | – | – | – | – | ✅ |
| Approvare utenti, cambiare ruoli | – | – | – | – | ✅ |

\* L'admin abilita i singoli dirigenti dalla pagina Admin ("Può inserire certificati").

## Notifiche push

- Su **iPhone** funzionano solo se l'app è aggiunta alla schermata Home (Safari → Condividi → Aggiungi alla schermata Home) e aperta dall'icona; poi si tocca **🔔 Attiva notifiche**
- Su **Android** da Chrome: menu ⋮ → Installa app, poi **🔔 Attiva notifiche**
- In OneSignal il Site URL deve essere esattamente `https://gestionale-calcio-gamma.vercel.app`

## Email (recupero password)

Supabase invia tramite **Brevo** (SMTP `smtp-relay.brevo.com:587`, mittente `dopolavorofootballclub@gmail.com`).
Lo username SMTP è il **Login** della pagina SMTP di Brevo (`…@smtp-brevo.com`), la password è una **SMTP key**.
In Brevo il blocco degli IP non autorizzati per le SMTP keys deve restare **disattivato** (Supabase invia da IP variabili).

## Note

- Piano gratuito Supabase: il progetto va in pausa dopo circa 7 giorni senza utilizzo; si riattiva dalla dashboard
- Le foto dello shop sono caricate da `dopolavoro47.wp-234.workers.dev`
