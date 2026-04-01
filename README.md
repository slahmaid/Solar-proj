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

## Run locally

Open `index.html` in a browser, or serve the folder so asset paths resolve correctly:

```bash
npx --yes serve .
```

Then open the URL shown (e.g. `http://localhost:3000`).

## Order emails (Web3Forms)

Orders are sent to **your email inbox** via [Web3Forms](https://web3forms.com) (free tier).

1. Create an access key at [web3forms.com](https://web3forms.com) and confirm the inbox you want to receive orders in.
2. In `index.html`, set the same key on **both** order forms (`#order-form` and `#order-form-retarget`):

   - `data-web3forms-access-key="YOUR_ACCESS_KEY"`

3. Deploy. Submissions appear as emails with the full order details (model, quantity, totals, address, phone).

Optional: customers can fill **البريد الإلكتروني (اختياري)** so Web3Forms can attach a reply address when supported.

## Optional React scaffold

The `src/components/` folder holds a small header example that imports `assets/logo.svg`. It is not wired to the static HTML build; use it only if you add a bundler (e.g. Vite + React).
