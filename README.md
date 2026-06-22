# Dopolavoro 47 — Gestionale Squadra di Calcio

## Setup in 5 passi

### 1. Apri la cartella in Cursor
Trascina la cartella `gestionale-calcio` dentro Cursor.

### 2. Configura le credenziali Supabase
Apri il file `.env.local` e sostituisci con i tuoi dati:
```
VITE_SUPABASE_URL=https://XXXXXXXXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyXXXXXXXXXXXXXXXXX
```
Trovi questi valori in **Supabase → Settings → API**.

### 3. Installa le dipendenze
Nel terminale di Cursor:
```bash
npm install
```

### 4. Avvia in locale
```bash
npm run dev
```
Apri http://localhost:5173

### 5. Deploy su Vercel (opzionale)
1. Vai su vercel.com e crea account gratuito
2. Clicca "New Project" e importa la cartella
3. Aggiungi le variabili d'ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
4. Clicca Deploy

---

## Struttura dell'app

```
src/
  context/
    AuthContext.jsx     → gestione login e ruoli
  pages/
    Login.jsx           → pagina di accesso
    Dashboard.jsx       → riepilogo generale
    Giocatori.jsx       → anagrafica squadra
    Calendario.jsx      → eventi, partite, allenamenti
    Finanze.jsx         → cassa, entrate e uscite
    Admin.jsx           → gestione utenti e certificati
  components/
    Sidebar.jsx         → navigazione laterale
  supabaseClient.js     → connessione Supabase
  index.css             → stili globali
  App.jsx               → routing principale
```

## Ruoli utente

| Ruolo | Accesso |
|-------|---------|
| **giocatore** | Dashboard, Giocatori (sola lettura), Calendario |
| **dirigente** | + Modifica giocatori, Gestione eventi |
| **cassiere** | + Accesso finanze, Registrazione movimenti |
| **admin** | Tutto, inclusa gestione utenti e certificati |

## Creare il primo utente Admin

1. Vai su **Supabase → Authentication → Users**
2. Clicca "Invite user" con la tua email
3. Accedi all'app, poi vai su **Supabase → Table Editor → profili**
4. Trova il tuo record e cambia `ruolo` da `giocatore` a `admin`
5. Da quel momento puoi gestire tutti gli altri utenti dall'app
