// Serve Client Command Center on the LAN so iPad/other devices can access it.
// Run: npm start  →  then open http://192.168.0.70:3000 from your iPad
// Data is stored in data/clients.json so all devices see the same list.

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const DATA_FILE = path.join(__dirname, "data", "clients.json");

app.use(express.json());
app.use(express.static(__dirname));

// API: shared client list (so computer and iPad see the same data)
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
  } catch (err) {
    console.error("Failed to write clients:", err.message);
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
  writeClients(list);
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

app.listen(PORT, HOST, () => {
  console.log(`Client Command Center running at:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  http://192.168.0.70:${PORT}  (use this on your iPad)`);
  console.log(`  Data file: ${DATA_FILE}`);
});
