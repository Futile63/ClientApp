// =========================
// CLIENT COMMAND CENTER - app.js
// Supports: Dashboard, Tier View (tier?tier=X), Client List (client-list)
// =========================

// =========================
// CONFIG
// =========================
const STORAGE_KEY = "ccc_clients_v1";

// Tier cadence (days) — per your rules
const CADENCE_DAYS = { 3: 30, 2: 60, 1: 90, 0: 0 };

// =========================
// PAGE MODE DETECTION
// =========================
const IS_TIER_PAGE = !!document.getElementById("tierList");
const IS_CLIENT_LIST_PAGE = !!document.getElementById("clientListPage");

// =========================
// DOM REFERENCES (COMMON)
// =========================
const clientForm = document.getElementById("clientForm");
const search = document.getElementById("search");

// Edit dialog (shared)
const editDialog = document.getElementById("editDialog");
const editForm = document.getElementById("editForm");

// =========================
// DOM REFERENCES (DASHBOARD)
// =========================
const todayList = document.getElementById("todayList");
const clientList = document.getElementById("clientList");

const bucketT3 = document.getElementById("bucketT3");
const bucketT2 = document.getElementById("bucketT2");
const bucketT1 = document.getElementById("bucketT1");
const bucketT0 = document.getElementById("bucketT0");

const countT3 = document.getElementById("countT3");
const countT2 = document.getElementById("countT2");
const countT1 = document.getElementById("countT1");
const countT0 = document.getElementById("countT0");

// =========================
// DOM REFERENCES (TIER PAGE)
// =========================
const tierList = document.getElementById("tierList");
const tierTitle = document.getElementById("tierTitle");
const tierSubtitle = document.getElementById("tierSubtitle");

// =========================
// STATE
// =========================
const state = {
  clients: [],
  query: ""
};

// =========================
// INIT (load from server so computer + iPad share data)
// =========================
(async function init() {
  await loadClientsFromServer();
  initEvents();
  initExportButtons();
  render();
})();

// =========================
// EVENTS
// =========================
function initEvents() {
  // Add Client exists on Client List page
  if (clientForm) {
    clientForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameEl = byId("name");
      const tierEl = byId("tier");
      const contactEl = byId("contact");
      const phoneEl = byId("phone");
      const notesEl = byId("notes");

      const name = (nameEl?.value ?? "").trim();
      if (!name) return;

      const client = {
        id: crypto.randomUUID(),
        name,
        tier: Number(tierEl?.value ?? 0),
        contact: (contactEl?.value ?? "").trim(),
        phone: (phoneEl?.value ?? "").trim(),
        notes: (notesEl?.value ?? "").trim(),
        nextAction: "",
        lastTouch: "", // YYYY-MM-DD
        nextTouch: ""  // YYYY-MM-DD
      };

      state.clients.unshift(client);
      saveAndRender();
      clientForm.reset();
      setTimeout(() => byId("name")?.focus(), 0);
    });
  }

  // Search exists on both pages
  if (search) {
    search.addEventListener("input", (e) => {
      state.query = (e.target.value ?? "").trim().toLowerCase();
      render();
    });
  }

  // Edit form exists on both pages
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = byId("editId")?.value;
      const c = state.clients.find(x => x.id === id);
      if (!c) return;

      c.name = (byId("editName")?.value ?? "").trim();
      c.tier = Number(byId("editTier")?.value ?? c.tier);
      c.contact = (byId("editContact")?.value ?? "").trim();
      c.phone = (byId("editPhone")?.value ?? "").trim();
      c.notes = (byId("editNotes")?.value ?? "").trim();
      c.nextAction = (byId("editNextAction")?.value ?? "").trim();
      const nextTouchVal = (byId("editNextTouch")?.value ?? "").trim();
      c.nextTouch = nextTouchVal || "";
      const lastTouchVal = (byId("editLastTouch")?.value ?? "").trim();
      c.lastTouch = lastTouchVal || "";

      saveAndRender();
      editDialog?.close();
    });

    const notesTa = byId("editNotes");
    const todoTa = byId("editNextAction");
    if (notesTa?.tagName === "TEXTAREA") notesTa.addEventListener("input", () => resizeEditTextarea(notesTa));
    if (todoTa?.tagName === "TEXTAREA") todoTa.addEventListener("input", () => resizeEditTextarea(todoTa));
  }
}

function initExportButtons() {
  const jsonBtn = byId("exportJsonBtn");
  const csvBtn = byId("exportCsvBtn");
  if (jsonBtn) jsonBtn.addEventListener("click", () => exportDownloadJson());
  if (csvBtn) csvBtn.addEventListener("click", () => exportDownloadCsv());
}

function exportDownloadJson() {
  const blob = new Blob([JSON.stringify(state.clients, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clients-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportDownloadCsv() {
  const headers = ["Name", "Tier", "Contact", "Phone", "Last Touch", "Next Touch", "Notes", "To Do"];
  const rows = state.clients.map((c) => [
    c.name,
    c.tier,
    c.contact || "",
    c.phone || "",
    c.lastTouch || "",
    c.nextTouch || "",
    (c.notes || "").replace(/[\r\n]+/g, " "),
    (c.nextAction || "").replace(/[\r\n]+/g, " ")
  ]);
  const escapeCsv = (s) => {
    const t = String(s);
    if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
    return t;
  };
  const lines = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clients-backup-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// =========================
// RENDER ROUTER
// =========================
function render() {
  if (IS_CLIENT_LIST_PAGE) renderClientListPage();
  else if (IS_TIER_PAGE) renderTierPage();
  else renderDashboard();
}

// =========================
// DASHBOARD RENDER
// =========================
const DASHBOARD_DUE_WITHIN_DAYS = 10;

function needsAttention(c, info) {
  const tier = normalizeTier(c.tier);
  if (tier === 0) return !!(c.nextAction && c.nextAction.trim());
  return info.overdueDays > 0 || !c.lastTouch || info.daysUntilDue <= DASHBOARD_DUE_WITHIN_DAYS;
}

function renderDashboard() {
  const rows = filteredClients(state.clients, state.query);
  const dashboardRows = rows.filter((c) => {
    const info = attentionInfo(c);
    return needsAttention(c, info);
  });

  const todaySummaryEl = byId("todaySummary");
  if (todaySummaryEl) {
    let overdue = 0, neverTouched = 0, dueSoon = 0;
    dashboardRows.forEach((c) => {
      const info = attentionInfo(c);
      const tier = normalizeTier(c.tier);
      if (tier !== 0 && info.overdueDays > 0) overdue++;
      else if (tier !== 0 && !c.lastTouch) neverTouched++;
      else dueSoon++;
    });
    const total = dashboardRows.length;
    if (total === 0) {
      todaySummaryEl.textContent = "No clients need attention right now.";
    } else {
      const parts = [];
      if (overdue) parts.push(`${overdue} overdue`);
      if (neverTouched) parts.push(`${neverTouched} never touched`);
      if (dueSoon) parts.push(`${dueSoon} due soon`);
      todaySummaryEl.textContent = `${total} need attention (${parts.join(", ")}).`;
    }
  }

  renderToday(dashboardRows);
  renderTouchedThisWeek(rows);
}

function renderTouchedThisWeek(allRows) {
  const section = byId("touchedThisWeekSection");
  const listEl = byId("touchedThisWeekList");
  if (!section || !listEl) return;
  const today = todayISO();
  const touched = allRows
    .filter((c) => c.lastTouch && daysBetween(c.lastTouch, today) >= 0 && daysBetween(c.lastTouch, today) <= 6)
    .sort((a, b) => (b.lastTouch > a.lastTouch ? 1 : -1));
  if (touched.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";
  listEl.innerHTML = "";
  for (const c of touched) {
    const li = document.createElement("li");
    li.className = `todayItem tier-${normalizeTier(c.tier)}`;
    li.innerHTML = `
      <div class="todayItemRow">
        <div class="todayLeft">
          <div class="todayName">${escapeHtml(c.name)}</div>
          <div class="bucketMeta">${(c.contact || c.phone) ? `<span>${contactPhoneHtml(c)}</span>` : ""}</div>
          <div class="actions">
            <button class="touchBtn">Touched Today</button>
            <button class="editBtn">Edit</button>
          </div>
        </div>
        <div class="todayRight">
          <span class="pill">Last: ${prettyDate(c.lastTouch)}</span>
        </div>
      </div>
    `;
    li.querySelector(".touchBtn")?.addEventListener("click", () => touch(c.id));
    li.querySelector(".editBtn")?.addEventListener("click", () => openEdit(c));
    listEl.appendChild(li);
  }
}

function renderTable(rows) {
  if (!clientList) return;
  clientList.innerHTML = "";

  for (const c of rows) {
    const tr = document.createElement("tr");
    tr.className = `tier-${normalizeTier(c.tier)}`;
    tr.innerHTML = `
      <td>${escapeHtml(c.name)}</td>
      <td>Tier ${c.tier}</td>
      <td>${c.lastTouch ? prettyDate(c.lastTouch) : "—"}</td>
      <td>${c.nextTouch ? prettyDate(c.nextTouch) : "—"}</td>
      <td>${c.nextAction ? escapeHtml(c.nextAction) : "—"}</td>
      <td>
        <button class="touchBtn">Touched</button>
        <button class="editBtn">Edit</button>
      </td>
    `;

    tr.querySelector(".touchBtn")?.addEventListener("click", () => touch(c.id));
    tr.querySelector(".editBtn")?.addEventListener("click", () => openEdit(c));

    clientList.appendChild(tr);
  }
}

function renderToday(rows) {
  if (!todayList) return;

  const ranked = [...rows]
    .map(c => ({ c, info: attentionInfo(c) }))
    .sort((a, b) => {
      if (b.info.score !== a.info.score) return b.info.score - a.info.score;
      if (b.info.overdueDays !== a.info.overdueDays) return b.info.overdueDays - a.info.overdueDays;
      return a.c.name.localeCompare(b.c.name);
    });

  todayList.innerHTML = "";

  for (const { c, info } of ranked) {
    const li = document.createElement("li");
    li.className = `todayItem tier-${normalizeTier(c.tier)}`;

    const { duePillClass, dueText } = dueBadge(c, info);
    const hasNotes = c.notes && c.notes.trim();
    const hasToDo = c.nextAction && c.nextAction.trim();

    li.innerHTML = `
      <div class="todayItemRow">
        <div class="todayLeft">
          <div class="todayName">${escapeHtml(c.name)}</div>
          <div class="bucketMeta">${(c.contact || c.phone) ? `<span>${contactPhoneHtml(c)}</span>` : ""}</div>
          <div class="actions">
            <button class="touchBtn">Touched Today</button>
            <button class="editBtn">Edit</button>
          </div>
        </div>
        <div class="todayCenter">
          ${hasNotes ? `<div class="todayNotes"><strong>Notes:</strong> ${escapeHtml(c.notes.trim())}</div>` : ""}
          ${hasToDo ? `<div class="todayToDo"><strong>To Do:</strong> ${escapeHtml(c.nextAction.trim())}</div>` : ""}
        </div>
        <div class="todayRight">
          <div class="pills">
            <span class="${duePillClass}">${dueText}</span>
            <span class="pill">Tier ${c.tier} • ${info.cadence}d</span>
            ${hasToDo ? `<span class="pill warn">To Do</span>` : ""}
          </div>
          <div class="touchDates">
            <span>Last: ${c.lastTouch ? prettyDate(c.lastTouch) : "Never"}</span>
            <span>Next: ${c.nextTouch ? prettyDate(c.nextTouch) : '<span class="nextNeedSchedule">Need to schedule</span>'}</span>
          </div>
        </div>
      </div>
    `;

    li.querySelector(".touchBtn")?.addEventListener("click", () => touch(c.id));
    li.querySelector(".editBtn")?.addEventListener("click", () => openEdit(c));

    todayList.appendChild(li);
  }
}

function sortByUrgency(clients) {
  return [...clients]
    .map(c => ({ c, info: attentionInfo(c) }))
    .sort((a, b) => urgencyCompare(a, b))
    .map(x => x.c);
}

function renderBuckets(rows) {
  if (!bucketT3 || !bucketT2 || !bucketT1 || !bucketT0) return;

  const t3 = sortByUrgency(rows.filter(c => normalizeTier(c.tier) === 3));
  const t2 = sortByUrgency(rows.filter(c => normalizeTier(c.tier) === 2));
  const t1 = sortByUrgency(rows.filter(c => normalizeTier(c.tier) === 1));
  const t0 = sortByUrgency(rows.filter(c => normalizeTier(c.tier) === 0));

  bucketT3.innerHTML = "";
  bucketT2.innerHTML = "";
  bucketT1.innerHTML = "";
  bucketT0.innerHTML = "";

  if (countT3) countT3.textContent = String(t3.length);
  if (countT2) countT2.textContent = String(t2.length);
  if (countT1) countT1.textContent = String(t1.length);
  if (countT0) countT0.textContent = String(t0.length);

  for (const c of t3) bucketT3.appendChild(makeBucketItem(c));
  for (const c of t2) bucketT2.appendChild(makeBucketItem(c));
  for (const c of t1) bucketT1.appendChild(makeBucketItem(c));
  for (const c of t0) bucketT0.appendChild(makeBucketItem(c));
}

function makeBucketItem(c) {
  const info = attentionInfo(c);
  const { duePillClass, dueText } = dueBadge(c, info);

  const li = document.createElement("li");
  li.className = `bucketItem tier-${normalizeTier(c.tier)}`;

  li.innerHTML = `
    <div class="bucketItemTop">
      <div class="bucketName">${escapeHtml(c.name)}${(c.contact || c.phone) ? ` <span class="bucketMeta">${contactPhoneHtml(c)}</span>` : ""}</div>
      <div class="bucketRight">
        <div class="pills">
          <span class="${duePillClass}">${dueText}</span>
          ${c.tier !== 0 ? `<span class="pill">${info.cadence}d cadence</span>` : ""}
          ${c.nextAction ? `<span class="pill warn">To Do</span>` : ""}
        </div>
        <div class="touchDates">
          <span>Last: ${c.lastTouch ? prettyDate(c.lastTouch) : "Never"}</span>
          <span>Next: ${c.nextTouch ? prettyDate(c.nextTouch) : '<span class="nextNeedSchedule">Need to schedule</span>'}</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="touchBtn">Touched Today</button>
      <button class="editBtn">Edit</button>
    </div>
  `;

  li.querySelector(".touchBtn")?.addEventListener("click", () => touch(c.id));
  li.querySelector(".editBtn")?.addEventListener("click", () => openEdit(c));

  return li;
}

// =========================
// TIER PAGE RENDER
// =========================
function renderTierPage() {
  const tier = getTierParam();
  const tierName = tierLabel(tier);

  if (tierTitle) tierTitle.textContent = tierName;
  if (tierSubtitle) tierSubtitle.textContent = "Sorted by next touch urgency (overdue → due soon → later).";
  document.title = `${tierName} • Client Command Center`;

  const rows = filteredClients(state.clients, state.query)
    .filter(c => normalizeTier(c.tier) === tier)
    .map(c => ({ c, info: attentionInfo(c) }))
    .sort((a, b) => urgencyCompare(a, b))
    .map(x => x.c);

  if (!tierList) return;
  tierList.innerHTML = "";

  for (const c of rows) {
    const info = attentionInfo(c);
    const { duePillClass, dueText } = dueBadge(c, info);
    const hasNotes = c.notes && c.notes.trim();
    const hasToDo = c.nextAction && c.nextAction.trim();

    const li = document.createElement("li");
    li.className = `todayItem tier-${normalizeTier(c.tier)}`;

    li.innerHTML = `
      <div class="todayItemRow">
        <div class="todayLeft">
          <div class="todayName">${escapeHtml(c.name)}</div>
          <div class="bucketMeta">${(c.contact || c.phone) ? `<span>${contactPhoneHtml(c)}</span>` : ""}</div>
          <div class="actions">
            <button class="touchBtn">Touched Today</button>
            <button class="editBtn">Edit</button>
          </div>
        </div>
        <div class="todayCenter">
          ${hasNotes ? `<div class="todayNotes"><strong>Notes:</strong> ${escapeHtml(c.notes.trim())}</div>` : ""}
          ${hasToDo ? `<div class="todayToDo"><strong>To Do:</strong> ${escapeHtml(c.nextAction.trim())}</div>` : ""}
        </div>
        <div class="todayRight">
          <div class="pills">
            <span class="${duePillClass}">${dueText}</span>
            ${tier !== 0 ? `<span class="pill">${info.cadence}d cadence</span>` : `<span class="pill">Prospect</span>`}
            ${hasToDo ? `<span class="pill warn">To Do</span>` : ""}
          </div>
          <div class="touchDates">
            <span>Last: ${c.lastTouch ? prettyDate(c.lastTouch) : "Never"}</span>
            <span>Next: ${c.nextTouch ? prettyDate(c.nextTouch) : '<span class="nextNeedSchedule">Need to schedule</span>'}</span>
          </div>
        </div>
      </div>
    `;

    li.querySelector(".touchBtn")?.addEventListener("click", () => touch(c.id));
    li.querySelector(".editBtn")?.addEventListener("click", () => openEdit(c));

    tierList.appendChild(li);
  }
}

// =========================
// CLIENT LIST PAGE RENDER
// =========================
function renderClientListPage() {
  const rows = filteredClients(state.clients, state.query);
  const t3 = sortByUrgency(rows.filter(c => normalizeTier(c.tier) === 3));
  const t2 = sortByUrgency(rows.filter(c => normalizeTier(c.tier) === 2));
  const t1 = sortByUrgency(rows.filter(c => normalizeTier(c.tier) === 1));
  const t0 = sortByUrgency(rows.filter(c => normalizeTier(c.tier) === 0));

  const listT3 = byId("clListT3");
  const listT2 = byId("clListT2");
  const listT1 = byId("clListT1");
  const listT0 = byId("clListT0");

  if (listT3) listT3.innerHTML = "";
  if (listT2) listT2.innerHTML = "";
  if (listT1) listT1.innerHTML = "";
  if (listT0) listT0.innerHTML = "";

  for (const c of t3) (listT3 && listT3.appendChild(makeClientListItem(c)));
  for (const c of t2) (listT2 && listT2.appendChild(makeClientListItem(c)));
  for (const c of t1) (listT1 && listT1.appendChild(makeClientListItem(c)));
  for (const c of t0) (listT0 && listT0.appendChild(makeClientListItem(c)));
}

function makeClientListItem(c) {
  const info = attentionInfo(c);
  const { duePillClass, dueText } = dueBadge(c, info);
  const hasNotes = c.notes && c.notes.trim();
  const hasToDo = c.nextAction && c.nextAction.trim();

  const li = document.createElement("li");
  li.className = `todayItem tier-${normalizeTier(c.tier)}`;

  li.innerHTML = `
    <div class="todayItemRow">
      <div class="todayLeft">
        <div class="todayName">${escapeHtml(c.name)}</div>
        <div class="bucketMeta">${(c.contact || c.phone) ? `<span>${contactPhoneHtml(c)}</span>` : ""}</div>
        <div class="actions">
          <button class="touchBtn">Touched Today</button>
          <button class="editBtn">Edit</button>
          <button class="danger delBtn">Delete</button>
        </div>
      </div>
      <div class="todayCenter">
        ${hasNotes ? `<div class="todayNotes"><strong>Notes:</strong> ${escapeHtml(c.notes.trim())}</div>` : ""}
        ${hasToDo ? `<div class="todayToDo"><strong>To Do:</strong> ${escapeHtml(c.nextAction.trim())}</div>` : ""}
      </div>
      <div class="todayRight">
        <div class="pills">
          <span class="${duePillClass}">${dueText}</span>
          ${c.tier !== 0 ? `<span class="pill">${info.cadence}d cadence</span>` : `<span class="pill">Prospect</span>`}
          ${hasToDo ? `<span class="pill warn">To Do</span>` : ""}
        </div>
        <div class="touchDates">
          <span>Last: ${c.lastTouch ? prettyDate(c.lastTouch) : "Never"}</span>
          <span>Next: ${c.nextTouch ? prettyDate(c.nextTouch) : '<span class="nextNeedSchedule">Need to schedule</span>'}</span>
        </div>
      </div>
    </div>
  `;

  li.querySelector(".touchBtn")?.addEventListener("click", () => touch(c.id));
  li.querySelector(".editBtn")?.addEventListener("click", () => openEdit(c));
  li.querySelector(".delBtn")?.addEventListener("click", () => removeClient(c.id));

  return li;
}

// =========================
// URGENCY SORT (TIER PAGE)
// Never touched → Overdue most → Due soonest → Name
// =========================
function urgencyCompare(a, b) {
  const A = a.info;
  const B = b.info;

  // Never touched first
  const aNever = !a.c.lastTouch && a.c.tier !== 0;
  const bNever = !b.c.lastTouch && b.c.tier !== 0;
  if (aNever !== bNever) return aNever ? -1 : 1;

  // Overdue first (more overdue first)
  if (A.overdueDays !== B.overdueDays) return B.overdueDays - A.overdueDays;

  // Due soonest first
  if (A.daysUntilDue !== B.daysUntilDue) return A.daysUntilDue - B.daysUntilDue;

  // Next action bump (optional)
  const aNext = !!(a.c.nextAction && a.c.nextAction.trim());
  const bNext = !!(b.c.nextAction && b.c.nextAction.trim());
  if (aNext !== bNext) return aNext ? -1 : 1;

  return a.c.name.localeCompare(b.c.name);
}

// =========================
// ACTIONS
// =========================
function touch(id) {
  const c = state.clients.find(x => x.id === id);
  if (!c) return;
  c.lastTouch = todayISO();
  saveAndRender();
}

function removeClient(id) {
  const c = state.clients.find(x => x.id === id);
  if (!c) return;

  const ok = confirm(`Delete ${c.name}?`);
  if (!ok) return;

  state.clients = state.clients.filter(x => x.id !== id);
  saveAndRender();
}

function resizeEditTextarea(el) {
  if (!el || el.tagName !== "TEXTAREA") return;
  el.style.height = "auto";
  el.style.height = Math.max(60, el.scrollHeight) + "px";
}

function openEdit(c) {
  if (!editDialog || !editForm) {
    alert("Edit dialog not found on this page.");
    return;
  }

  byId("editId").value = c.id;
  byId("editName").value = c.name;
  byId("editTier").value = String(c.tier);
  byId("editContact").value = c.contact || "";
  byId("editPhone").value = c.phone || "";
  byId("editNotes").value = c.notes || "";
  byId("editNextAction").value = c.nextAction || "";
  byId("editNextTouch").value = c.nextTouch || "";
  byId("editLastTouch").value = c.lastTouch || "";

  editDialog.showModal();
  setTimeout(() => {
    resizeEditTextarea(byId("editNotes"));
    resizeEditTextarea(byId("editNextAction"));
  }, 0);
}

// =========================
// DUE / PRIORITY CALCS
// =========================
function attentionInfo(c) {
  const tier = Number(c.tier);
  const cadence = CADENCE_DAYS[tier] ?? 60;

  // Tier 0 (Prospects): no cadence expectation by default
  if (tier === 0) {
    const hasNext = !!(c.nextAction && c.nextAction.trim());
    const score = hasNext ? 150 : 0;
    return { cadence: 0, daysSince: 0, overdueDays: 0, daysUntilDue: 9999, score };
  }

  const daysSince = c.lastTouch ? daysBetween(c.lastTouch, todayISO()) : 9999;
  const overdueDays = Math.max(0, daysSince - cadence);
  const daysUntilDue = Math.max(0, cadence - daysSince);

  let score = 0;
  if (!c.lastTouch) score += 400;
  if (overdueDays > 0) score += 1000 + overdueDays * 10;
  else score += Math.max(0, (30 - daysUntilDue));
  if (c.nextAction && c.nextAction.trim().length > 0) score += 250;

  return { cadence, daysSince, overdueDays, daysUntilDue, score };
}

function dueBadge(c, info) {
  if (Number(c.tier) === 0) {
    return { duePillClass: "pill", dueText: "Prospect" };
  }

  // Color: Scheduled = green; needs first touch/overdue/due soon = red; 8–14d = yellow; 15+d = green
  let duePillClass = "pill";
  if (!c.lastTouch && c.nextTouch) {
    duePillClass = "pill pillDueGreen"; // Scheduled
  } else if (!c.lastTouch || info.overdueDays > 0 || info.daysUntilDue <= 7) {
    duePillClass = "pill pillDueRed";
  } else if (info.daysUntilDue <= 14) {
    duePillClass = "pill pillDueYellow";
  } else {
    duePillClass = "pill pillDueGreen";
  }

  const dueText =
    !c.lastTouch ? (c.nextTouch ? "Scheduled" : "Needs first touch") :
    info.overdueDays > 0 ? `Overdue ${info.overdueDays}d` :
    info.daysUntilDue === 0 ? "Due today" :
    `Due in ${info.daysUntilDue}d`;

  return { duePillClass, dueText };
}

// =========================
// STORAGE (server = shared; localStorage = fallback when offline/same device)
// =========================
function normalizeClient(c) {
  if (!c || typeof c !== "object") return null;
  return {
    id: String(c.id || crypto.randomUUID()),
    name: String(c.name || "").trim(),
    tier: normalizeTier(c.tier),
    contact: String(c.contact || "").trim(),
    phone: String(c.phone || "").trim(),
    notes: String(c.notes || "").trim(),
    nextAction: String(c.nextAction || "").trim(),
    lastTouch: c.lastTouch ? String(c.lastTouch).trim() : "",
    nextTouch: c.nextTouch ? String(c.nextTouch).trim() : ""
  };
}

function normalizeClientList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeClient).filter(Boolean);
}

function ensureClientShape(c) {
  if (!c || typeof c !== "object") return null;
  return {
    id: c.id != null && c.id !== "" ? String(c.id) : crypto.randomUUID(),
    name: c.name != null ? String(c.name).trim() : "",
    tier: normalizeTier(c.tier),
    contact: c.contact != null ? String(c.contact).trim() : "",
    phone: c.phone != null ? String(c.phone).trim() : "",
    notes: c.notes != null ? String(c.notes).trim() : "",
    nextAction: c.nextAction != null ? String(c.nextAction).trim() : "",
    lastTouch: c.lastTouch != null && c.lastTouch !== "" ? String(c.lastTouch).trim() : "",
    nextTouch: c.nextTouch != null && c.nextTouch !== "" ? String(c.nextTouch).trim() : ""
  };
}

async function loadClientsFromServer() {
  try {
    const r = await fetch("/api/clients");
    if (r.ok) {
      const data = await r.json();
      const raw = Array.isArray(data) ? data : (Array.isArray(data?.clients) ? data.clients : []);
      const list = raw.filter(c => c && typeof c === "object").map(ensureClientShape).filter(Boolean);
      if (list.length > 0) {
        state.clients = list;
        return;
      }
    }
  } catch (_) { /* server not reachable or wrong server */ }
  const local = loadClients();
  const raw = Array.isArray(local) ? local : [];
  state.clients = raw.filter(c => c && typeof c === "object").map(ensureClientShape).filter(Boolean);
  if (state.clients.length > 0) {
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.clients)
    }).catch(() => {});
  }
}

function loadClients() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.clients));
  fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state.clients)
  })
    .then((r) => {
      if (!r.ok) {
        console.error("Server save failed:", r.status);
        alert("Could not save to server. Your changes are saved in this browser only.");
      }
    })
    .catch(() => {
      alert("Could not reach server. Your changes are saved in this browser only.");
    });
  render();
}

// =========================
// HELPERS
// =========================
function normalizeTier(t) {
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : 0;
}


function tierLabel(t) {
  const n = normalizeTier(t);
  if (n === 3) return "Tier 3";
  if (n === 2) return "Tier 2";
  if (n === 1) return "Tier 1";
  return "Tier 0 / Prospect";
}

function filteredClients(clients, q) {
  if (!q) return clients;

  return clients.filter(c => {
    const hay = `${c.name} ${c.contact} ${c.phone || ""} ${c.notes} ${c.nextAction} tier ${c.tier}`.toLowerCase();
    return hay.includes(q);
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(isoA, isoB) {
  const [ya, ma, da] = isoA.split("-").map(Number);
  const [yb, mb, db] = isoB.split("-").map(Number);
  const a = new Date(ya, ma - 1, da);
  const b = new Date(yb, mb - 1, db);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function prettyDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Contact/phone with click-to-call and click-to-email where applicable */
function contactPhoneHtml(c) {
  const contact = (c.contact || "").trim();
  const phone = (c.phone || "").trim();
  if (!contact && !phone) return "";
  const parts = [];
  if (contact) {
    if (contact.includes("@")) {
      const safe = escapeHtml(contact);
      const href = "mailto:" + encodeURIComponent(contact);
      parts.push(`<a href="${href}" class="contactLink">${safe}</a>`);
    } else {
      parts.push(escapeHtml(contact));
    }
  }
  if (phone) {
    const telHref = "tel:" + phone.replace(/\s/g, "").replace(/[^\d+()-]/g, "") || phone;
    parts.push(`<a href="${telHref}" class="contactLink">${escapeHtml(phone)}</a>`);
  }
  return parts.join(" · ");
}

// =========================
// TIER PARAM HELPERS
// =========================
function getTierParam() {
  // Use URL parsing so this works even if other code manipulates location/search
  const url = new URL(window.location.href);
  const raw = url.searchParams.get("tier");

  if (raw === null) return 3; // default

  const tier = parseInt(raw, 10);
  if ([0, 1, 2, 3].includes(tier)) return tier;

  return 3;
}
