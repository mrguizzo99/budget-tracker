# Budget Giornaliero — PWA iOS

Progressive Web App mobile-first ottimizzata per iPhone (Safari iOS), progettata per essere hostata su **GitHub Pages** senza build step né framework esterni.

## Funzionalità principali

- **Ciclo mensile dal 10 al 10**: il conteggio parte il **10 di ogni mese** e si resetta automaticamente il **10 del mese successivo** (configurabile anche nelle Impostazioni).
- **Calcolo dinamico giornaliero (Rollover automatico)**:
  ```text
  Budget_Disponibile_Oggi = ((Budget_Mensile - Spese_Giorni_Precedenti_Del_Ciclo) / Giorni_Rimanenti_Incluso_Oggi) - Spese_Oggi
  ```
- **Widget circolare SVG animato** con soglie colore iOS:
  - Verde (`#30D158`): > 50% della quota odierna
  - Arancione (`#FF9F0A`): tra 20% e 50%
  - Rosso (`#FF453A`): < 20% o negativo (sforamento)
- **Apertura istantanea offline**: cache transazioni in `localStorage` + Service Worker (`sw.js`) per gli asset statici + sincronizzazione in background e pull-to-refresh.
- **Gestione spese**: aggiunta rapida (`+`) e eliminazione (tap cestino o swipe verso sinistra) con aggiornamento ottimistico della UI.

## Contratto API Google Apps Script

- **`GET`** `API_URL?token=API_TOKEN`
  - Restituisce un array JSON di transazioni oppure un oggetto `{ transactions: [...], monthly_budget: 600 }` (o `data` / `items` / `rows`). Se `monthly_budget` è presente, la PWA aggiorna automaticamente `BUDGET_MENSILE` in `localStorage` e ricalcola la dashboard.
- **`POST`** `API_URL` (con header `Content-Type: text/plain;charset=utf-8` per evitare preflight CORS):
  - Aggiunta spesa:
    ```json
    { "token": "...", "action": "add", "amount": 12.5, "merchant": "Bar", "category": "Cibo", "date": "2026-11-23T10:30:00.000Z" }
    ```
  - Eliminazione spesa:
    ```json
    { "token": "...", "action": "delete", "id": "tx_123" }
    ```
  - Aggiornamento budget mensile:
    ```json
    { "token": "...", "action": "set_budget", "monthly_budget": 750 }
    ```

## Deploy su GitHub Pages e installazione su iPhone

1. Carica tutti i file (`index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`, `icons/`) nella root di un repository GitHub.
2. Attiva **Settings → Pages → Deploy from a branch** (`main` / `/root`).
3. Apri l'URL pubblicato in **Safari su iPhone**, tocca **Condividi → Aggiungi alla schermata Home**.
4. Al primo avvio inserisci `BUDGET_MENSILE`, `API_URL` (`/exec`) e `API_TOKEN`.
