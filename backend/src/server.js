const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "orders.db");
const CSV_PATH = path.join(DATA_DIR, "orders.csv");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    model TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    fullname TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    source_form TEXT,
    user_agent TEXT,
    ip TEXT
  );
`);

if (!fs.existsSync(CSV_PATH)) {
  fs.writeFileSync(
    CSV_PATH,
    "id,created_at,model,quantity,unit_price,total_price,fullname,city,address,phone,source_form,ip\n",
    "utf8"
  );
}

function csvEscape(value) {
  const v = String(value ?? "");
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function validateOrder(input) {
  const model = String(input.model || "").trim().toUpperCase();
  const quantity = Number.parseInt(input.quantity, 10);
  const unitPrice = Number.parseInt(input.unitPrice, 10);
  const fullname = String(input.fullname || "").trim();
  const city = String(input.city || "").trim();
  const address = String(input.address || "").trim();
  const phone = String(input.phone || "").trim();
  const sourceForm = String(input.sourceForm || "").trim();

  if (!["300W", "400W"].includes(model)) return { ok: false, error: "INVALID_MODEL" };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { ok: false, error: "INVALID_QUANTITY" };
  if (!Number.isInteger(unitPrice) || unitPrice < 1) return { ok: false, error: "INVALID_UNIT_PRICE" };
  if (fullname.length < 3) return { ok: false, error: "INVALID_NAME" };
  if (city.length < 2) return { ok: false, error: "INVALID_CITY" };
  if (address.length < 5) return { ok: false, error: "INVALID_ADDRESS" };
  if (phone.length < 6 || phone.length > 30) return { ok: false, error: "INVALID_PHONE" };

  return {
    ok: true,
    value: {
      model,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      fullname,
      city,
      address,
      phone,
      sourceForm
    }
  };
}

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: "200kb" }));
app.use(morgan("tiny"));
app.use("/manage", express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "orders-backend" });
});

app.post("/api/orders", (req, res) => {
  const parsed = validateOrder(req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ ok: false, error: parsed.error });
  }

  const payload = parsed.value;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const userAgent = req.headers["user-agent"] || "";

  const insert = db.prepare(`
    INSERT INTO orders (
      model, quantity, unit_price, total_price, fullname, city, address, phone, source_form, user_agent, ip
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = insert.run(
    payload.model,
    payload.quantity,
    payload.unitPrice,
    payload.totalPrice,
    payload.fullname,
    payload.city,
    payload.address,
    payload.phone,
    payload.sourceForm,
    String(userAgent),
    String(ip)
  );

  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(info.lastInsertRowid);
  const csvRow = [
    row.id,
    row.created_at,
    row.model,
    row.quantity,
    row.unit_price,
    row.total_price,
    row.fullname,
    row.city,
    row.address,
    row.phone,
    row.source_form || "",
    row.ip || ""
  ]
    .map(csvEscape)
    .join(",")
    .concat("\n");
  fs.appendFileSync(CSV_PATH, csvRow, "utf8");

  res.status(201).json({ ok: true, orderId: row.id });
});

app.get("/api/orders", (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 200, 1000);
  const orders = db
    .prepare(
      `SELECT id, created_at, model, quantity, unit_price, total_price, fullname, city, address, phone, source_form
       FROM orders
       ORDER BY id DESC
       LIMIT ?`
    )
    .all(limit);
  res.json({ ok: true, count: orders.length, orders });
});

app.get("/api/orders.csv", (req, res) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
  fs.createReadStream(CSV_PATH).pipe(res);
});

app.listen(PORT, () => {
  console.log(`Orders backend running on http://localhost:${PORT}`);
});
