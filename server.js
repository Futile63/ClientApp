// Client Command Center - optional login when APP_USER and APP_PASSWORD are set.
// Data is stored in data/clients.json.
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
// Optional: set DATA_DIR (e.g. /data) when using a persistent disk so clients.json survives redeploys
const DATA_DIR = process.env.DATA_DIR && process.env.DATA_DIR.trim()
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "clients.json");

const AUTH_ENABLED =
  process.env.APP_USER && process.env.APP_USER.trim() &&
  process.env.APP_PASSWORD && process.env.APP_PASSWORD.trim();
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me-in-production";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 days
  })
);

function requireAuth(req, res, next) {
  if (!AUTH_ENABLED) return next();
  if (req.session && req.session.user) return next();
  if (req.path === "/login" && (req.method === "GET" || req.method === "POST")) return next();
  if (req.path === "/logout") return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Unauthorized" });
  return res.redirect("/login");
}

app.use(requireAuth);

app.get("/login", (req, res) => {
  if (req.session && req.session.user) return res.redirect("/");
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/login", (req, res) => {
  const user = (req.body.username || "").trim();
  const pass = req.body.password || "";
  if (
    AUTH_ENABLED &&
    user === process.env.APP_USER &&
    pass === process.env.APP_PASSWORD
  ) {
    req.session.user = user;
    return res.redirect("/");
  }
  res.redirect("/login?error=1");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {});
  res.redirect("/login");
});
app.post("/logout", (req, res) => {
  req.session.destroy(() => {});
  res.redirect("/login");
});

function readClients() {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return null;
  }
}

function writeClients(clients) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(clients), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to write clients:", err.message);
    return false;
  }
}

app.get("/api/clients", (req, res) => {
  const data = readClients();
  const list = data === null ? [] : data;
  console.log("GET /api/clients →", list.length, "clients");
  res.json(list);
});

app.post("/api/clients", (req, res) => {
  const body = req.body;
  const list = Array.isArray(body) ? body : [];
  if (!Array.isArray(body)) {
    return res.status(400).json({ error: "Body must be a JSON array of clients." });
  }
  const ok = writeClients(list);
  if (!ok) {
    return res.status(500).json({ error: "Failed to save clients to disk." });
  }
  console.log("POST /api/clients → saved", list.length, "clients");
  res.json(list);
});

app.get("/tier", (req, res) => {
  res.sendFile(path.join(__dirname, "tier.html"));
});
app.get("/client-list", (req, res) => {
  res.sendFile(path.join(__dirname, "client-list.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use(express.static(__dirname));

app.listen(PORT, HOST, () => {
  console.log(`Client Command Center running at http://localhost:${PORT}`);
  if (AUTH_ENABLED) console.log("Login enabled (APP_USER / APP_PASSWORD set).");
  else console.log("Login disabled. Set APP_USER and APP_PASSWORD to enable.");
  console.log("Data file:", DATA_FILE);
});
