const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-session-secret";

const dataDir = path.join(__dirname, "data");
const ordersPath = path.join(dataDir, "orders.csv");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(ordersPath)) {
  fs.writeFileSync(
    ordersPath,
    "id,created_at,model,quantity,unit_price,total_price,fullname,city,address,phone,source_form,ip\n",
    "utf8"
  );
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(
  session({
    name: "orders.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);
app.use("/admin", express.static(path.join(__dirname, "public")));

function requireAuth(req, res, next) {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  result.push(current);
  return result;
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  req.session.isAdmin = true;
  req.session.username = username;
  return res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => {
    res.clearCookie("orders.sid");
    res.json({ ok: true });
  });
});

app.get("/api/me", (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ authenticated: false });
  }
  return res.json({ authenticated: true, username: req.session.username || ADMIN_USER });
});

app.post("/api/orders", (req, res) => {
  const {
    model,
    quantity,
    unitPrice,
    totalPrice,
    fullname,
    city,
    address,
    phone,
    sourceForm,
  } = req.body || {};

  if (!fullname || !city || !address || !phone || !model) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const id = Date.now();
  const createdAt = new Date().toISOString();
  const row = [
    id,
    createdAt,
    model,
    Number(quantity) || 1,
    Number(unitPrice) || 0,
    Number(totalPrice) || 0,
    fullname,
    city,
    address,
    phone,
    sourceForm || "",
    req.ip || "",
  ]
    .map(csvEscape)
    .join(",");

  fs.appendFileSync(ordersPath, `${row}\n`, "utf8");
  return res.status(201).json({ ok: true, id });
});

app.get("/api/orders", requireAuth, (req, res) => {
  const content = fs.readFileSync(ordersPath, "utf8").trim();
  if (!content) return res.json([]);

  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return res.json([]);

  const headers = parseCsvLine(lines[0]);
  const orders = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const item = {};
    headers.forEach((header, idx) => {
      item[header] = cols[idx] ?? "";
    });
    return item;
  });

  return res.json(orders.reverse());
});

app.get("/api/orders/export.csv", requireAuth, (_, res) => {
  const content = fs.readFileSync(ordersPath, "utf8");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
  return res.send(content);
});

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Orders API listening on http://localhost:${PORT}`);
  if (ADMIN_PASSWORD === "change-me") {
    console.log(
      "WARNING: Change ADMIN_USER / ADMIN_PASSWORD environment variables before production."
    );
  }
  if (SESSION_SECRET === "change-this-session-secret") {
    console.log("WARNING: Change SESSION_SECRET before production.");
  }
});
