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
| `backend/src/server.js` | Orders API backend (save/manage orders) |
| `backend/data/orders.db` | SQLite database for orders |
| `backend/data/orders.csv` | CSV export file (sheet-friendly) |

## Run locally

Open `index.html` in a browser, or serve the folder so asset paths resolve correctly:

```bash
npx --yes serve .
```

Then open the URL shown (e.g. `http://localhost:3000`).

## Backend orders system (no admin panel)

The backend is simple and strong: it stores each order in SQLite and appends to a CSV file for easy management in Excel/Sheets.

### Start backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:4000`.

### Endpoints

- `POST /api/orders` -> store a new order
- `GET /api/orders?limit=500` -> read latest orders (read-only)
- `GET /api/orders.csv` -> download CSV file directly
- `GET /manage` -> simple read-only orders page

### Frontend integration

Both order forms send to:

- `data-order-endpoint="http://localhost:4000/api/orders"`

After successful save, customer is redirected to WhatsApp confirmation chat automatically.

## Optional React scaffold

The `src/components/` folder holds a small header example that imports `assets/logo.svg`. It is not wired to the static HTML build; use it only if you add a bundler (e.g. Vite + React).
