# Solar projector — landing (Morocco)

Static Arabic RTL landing page: order forms, pricing, FAQ, and SEO JSON-LD.

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | Main page (entry point) |
| `css/main.css` | All styles |
| `js/main.js` | Order forms, totals, header scroll |
| `assets/logo.svg` | Header & footer logo |
| `assets/images/Hero-desktop.jpeg` | Hero (desktop) |
| `assets/images/Hero-mobile.jpeg` | Hero (mobile) |
| `privacy.html` | سياسة الخصوصية |
| `terms.html` | شروط الاستخدام |
| `preview.html` | Redirect to `index.html` (legacy bookmark) |
| `backend/google-apps-script/Code.gs` | Google Sheets order logger (Apps Script) |

## Orders → Google Sheet + WhatsApp

Each submit is sent to your **Google Sheet** (if configured), then the customer is redirected to **WhatsApp** with the same details.

### 1) Create the sheet

1. Create a new Google Sheet (any name).
2. **Extensions → Apps Script**.
3. Replace the default code with `backend/google-apps-script/Code.gs`.
4. In `Code.gs`, set `SECRET_TOKEN` to a long random string (keep it private).

### 2) Deploy the web app

1. **Deploy → New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone** (required for the public site).
5. Deploy and copy the **Web app URL** (ends with `/exec`).

### 3) Connect the landing page

In `index.html`, on **both** `<form class="order-form">` elements, set:

- `data-sheet-endpoint="PASTE_WEB_APP_URL_HERE"`
- `data-sheet-token="SAME_SECRET_TOKEN_AS_IN_Code_gs"`

Leave both attributes **empty** to skip the sheet and only use WhatsApp.

### 4) Sheet columns

The script creates a tab **Orders** with headers:

`Date` · `Model` · `Quantity` · `Total (MAD)` · `Full name` · `City` · `Address` · `Phone` · `Form` · `Page URL`

### 5) Notes

- The browser uses `no-cors` POST for `script.google.com` URLs so orders still reach the sheet without CORS errors.
- A hidden honeypot field reduces simple bot spam.
- If sheet send fails (network), the user is still sent to WhatsApp so you do not lose the lead.

### Troubleshooting (no rows in the sheet)

1. **Spreadsheet binding** — In `Code.gs`, set `SPREADSHEET_ID` to the ID from your sheet URL (`.../d/THIS_ID/edit`). Use this if the Apps Script project was **not** created via **Extensions → Apps Script** from inside that sheet. If `SPREADSHEET_ID` is empty and the script is standalone, `getActiveSpreadsheet()` is `null` and **no rows are written**.
2. **Redeploy** — After editing `Code.gs`, use **Deploy → Manage deployments → Edit** (new version) so the live URL runs the latest code.
3. **Executions** — In Apps Script, open **Executions** and check for errors (e.g. permission, wrong sheet ID).
4. **Token** — `data-sheet-token` in `index.html` must match `SECRET_TOKEN` in `Code.gs` exactly.

## Run locally

Open `index.html` in a browser, or serve the folder so asset paths resolve correctly:

```bash
npx --yes serve .
```

Then open the URL shown (e.g. `http://localhost:3000`).

## Optional React scaffold

The `src/components/` folder holds a small header example that imports `assets/logo.svg`. It is not wired to the static HTML build; use it only if you add a bundler (e.g. Vite + React).
