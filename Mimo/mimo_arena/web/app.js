// MIMO Arena front-end. Talks to FastAPI over REST + WebSocket.
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const state = {
  chatId: null,
  chats: [],
  workers: [],
  personas: [],
  audit: [],
  targetValue: "scout",
  hybridSkills: [],
};

// ---- active streaming bubbles -----------------------------------------------
// Map<stream_id, { el: Element, body: Element, sender: string }> 
// Lets us precisely target the right in-progress bubble per concurrent stream.
const _activeBubbles = new Map();
// Also track latest stream_id per sender so the final message can finalize it.
const _senderStreamId = new Map();

// ---- API helpers ----------------------------------------------------------
const api = {
  async listChats() { return (await fetch("/api/chats")).json(); },
  async createChat() { return (await fetch("/api/chats", { method: "POST" })).json(); },
  async getChat(id) { return (await fetch(`/api/chats/${id}`)).json(); },
  async deleteChat(id) { return (await fetch(`/api/chats/${id}`, { method: "DELETE" })).json(); },
  async send(text, to, skills) {
    return (await fetch("/api/message", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, to, skills: skills || [] }),
    })).json();
  },
  async addExecutor() { return (await fetch("/api/executors", { method: "POST" })).json(); },
  async state() { return (await fetch("/api/state")).json(); },
  async personas() { return (await fetch("/api/personas")).json(); },
  async settings() { return (await fetch("/api/settings")).json(); },
  async saveSettings(values) {
    return (await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    })).json();
  },
  async audit(limit = 80) { return (await fetch(`/api/audit?limit=${limit}`)).json(); },
  async trace(limit = 200) { return (await fetch(`/api/trace?limit=${limit}`)).json(); },
  async skills() { return (await fetch("/api/skills")).json(); },
  async shutdown() { return (await fetch("/api/shutdown", { method: "POST" })).json(); },
};

// ---- helpers ---------------------------------------------------------------
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function personaColor(id) {
  const map = {
    planner: "var(--p-planner)", designer: "var(--p-designer)",
    coder: "var(--p-coder)", reviewer: "var(--p-reviewer)",
    "designer-reviewer": "var(--p-designer-reviewer)",
    "coder-reviewer": "var(--p-coder-reviewer)",
    "planner-architect": "var(--p-planner-architect)",
    scout: "var(--p-scout)", maestro: "var(--p-maestro)",
  };
  // Also check personas cache for dynamic colors
  const cached = state.personas.find((p) => p.id === id);
  if (cached && cached.color) return cached.color;
  return map[id] || "var(--accent)";
}

function relTime(ts) {
  if (!ts) return "";
  let d = (typeof ts === "number" ? ts * (ts < 1e12 ? 1000 : 1) : Date.parse(ts));
  if (isNaN(d)) return "";
  const diff = Math.max(0, (Date.now() - d) / 1000);
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---- target dropdown (who receives the message) ---------------------------
function buildTargetMenu() {
  const menu = $("#targetMenu");
  const btn = $("#targetBtn");
  const label = $("#targetLabel");
  if (!menu) return;

  const workers = state.workers;
  const opts = [{ value: "scout", label: "Scout", color: "var(--p-scout)", sub: "Analyst" }];
  workers.filter((w) => w.role === "executor").forEach((w) => {
    opts.push({ value: w.id, label: w.id, color: "var(--p-coder)", sub: "Executor" });
  });

  if (!opts.find((o) => o.value === state.targetValue)) state.targetValue = "scout";
  const cur = opts.find((o) => o.value === state.targetValue) || opts[0];
  label.textContent = cur.label;
  const dotEl = btn.querySelector(".dot");
  if (dotEl) dotEl.style.background = cur.color;

  menu.innerHTML = "";
  opts.forEach((o) => {
    const el = document.createElement("div");
    el.className = `seg-opt${o.value === state.targetValue ? " selected" : ""}`;
    el.innerHTML = `<span class="dot" style="background:${o.color}"></span><span>${escapeHtml(o.label)}</span><span class="sub">${o.sub}</span>`;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      state.targetValue = o.value;
      label.textContent = o.label;
      if (dotEl) dotEl.style.background = o.color;
      menu.classList.remove("open");
      buildTargetMenu();
    });
    menu.appendChild(el);
  });
}

// ---- hybrid checklist ------------------------------------------------------
const HYBRID_OPTIONS = [
  { value: "analyze", label: "Analyze", sub: "Inspect files and context", color: "var(--p-scout)" },
  { value: "plan", label: "Plan", sub: "Break down the work", color: "var(--p-planner)" },
  { value: "build", label: "Build", sub: "Implement the task", color: "var(--p-coder)" },
  { value: "review", label: "Review", sub: "Check quality and risks", color: "var(--p-reviewer)" },
];

function buildHybridChecks() {
  const menu = $("#hybridChecks");
  if (!menu) return;
  menu.innerHTML = "";
  
  const label = $("#hybridLabel");
  if (label) {
    if (state.hybridSkills.length === 0) label.textContent = "None";
    else if (state.hybridSkills.length === 1) label.textContent = state.hybridSkills[0];
    else label.textContent = state.hybridSkills.length + " selected";
  }

  HYBRID_OPTIONS.forEach((opt) => {
    const checked = state.hybridSkills.includes(opt.value);
    const row = document.createElement("label");
    row.className = `check-opt${checked ? " selected" : ""}`;
    row.innerHTML = `
      <input type="checkbox" value="${opt.value}" ${checked ? "checked" : ""} />
      <span class="dot" style="background:${opt.color}"></span>
      <span class="text">
        <span class="title">${escapeHtml(opt.label)}</span>
        <span class="sub">${escapeHtml(opt.sub)}</span>
      </span>`;
    const input = row.querySelector("input");
    input.addEventListener("change", () => {
      if (input.checked) {
        if (!state.hybridSkills.includes(opt.value)) state.hybridSkills.push(opt.value);
      } else {
        state.hybridSkills = state.hybridSkills.filter((value) => value !== opt.value);
      }
      buildHybridChecks();
    });
    menu.appendChild(row);
  });
}

function initDropdowns() {
  const setup = (btnSel, menuSel, builder) => {
    const btn = $(btnSel), menu = $(menuSel);
    if (!btn || !menu) return;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      $$(".seg-menu.open").forEach((m) => { if (m !== menu) m.classList.remove("open"); });
      builder();
      menu.classList.toggle("open");
    });
  };
  setup("#targetBtn", "#targetMenu", buildTargetMenu);
  setup("#hybridBtn", "#hybridMenu", buildHybridChecks);
  document.addEventListener("click", () => $$(".seg-menu.open").forEach((m) => m.classList.remove("open")));
  
  const hybridMenu = $("#hybridMenu");
  if (hybridMenu) hybridMenu.addEventListener("click", (e) => e.stopPropagation());
}

// ---- message rendering -----------------------------------------------------
function roleClass(role) {
  return ["user", "scout", "executor", "maestro", "system"].includes(role) ? role : "system";
}

function senderLabel(sender, role) {
  if (role === "user") return "You";
  if (role === "maestro") return "Maestro";
  if (role === "scout") return "Scout";
  if (role === "system") return "System";
  return sender;
}

const EMPTY_HTML = `
  <div class="stream-empty">
    <div class="ic">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg>
    </div>
    <h3>Start a new mission</h3>
    <p>Write the task and send it to Scout to analyze the project and lay out a plan. Maestro then distributes the roles across the executors so they can work in parallel.</p>
    <div class="persona-legend">
      <span class="chip"><span class="dot" style="background:var(--p-scout)"></span>Scout</span>
      <span class="chip"><span class="dot" style="background:var(--p-planner)"></span>Planner</span>
      <span class="chip"><span class="dot" style="background:var(--p-designer)"></span>Designer</span>
      <span class="chip"><span class="dot" style="background:var(--p-coder)"></span>Coder</span>
      <span class="chip"><span class="dot" style="background:var(--p-reviewer)"></span>Reviewer</span>
    </div>
  </div>`;

function clearStream(showEmpty) {
  const stream = $("#stream");
  stream.innerHTML = showEmpty ? EMPTY_HTML : "";
}

function addMessage(m) {
  const stream = $("#stream");
  const empty = stream.querySelector(".stream-empty");
  if (empty) empty.remove();
  const wrap = document.createElement("div");
  wrap.className = `msg ${roleClass(m.role)}`;
  const head = document.createElement("div");
  head.className = "head";
  const badge = m.persona ? `<span class="badge">${escapeHtml(m.persona)}</span>` : "";
  head.innerHTML = `<span class="tag"></span><span>${escapeHtml(senderLabel(m.sender, m.role))}</span>${badge}`;
  const body = document.createElement("div");
  body.className = "body";
  body.textContent = m.text || "";
  if (m.role !== "system") wrap.appendChild(head);
  wrap.appendChild(body);
  stream.appendChild(wrap);
  stream.scrollTop = stream.scrollHeight;
}

// ---- streaming helpers -----------------------------------------------------

/**
 * Create or update an in-progress streaming bubble.
 * Uses stream_id for precise targeting so concurrent workers don't collide.
 */
function handleStreamChunk(data) {
  const streamId = data.stream_id || data.sender;
  const sender   = data.sender || "worker";
  const role     = data.role || "executor";
  const persona  = data.persona || "";
  const text     = data.text || "";

  let entry = _activeBubbles.get(streamId);
  if (!entry) {
    // First chunk — create bubble
    const el = _createMsgEl(sender, role, persona);
    el.setAttribute("data-stream-id", streamId);
    el.setAttribute("data-streaming", "true");
    const streamEl = $("#stream");
    const empty = streamEl.querySelector(".stream-empty");
    if (empty) empty.remove();
    streamEl.appendChild(el);
    streamEl.scrollTop = streamEl.scrollHeight;
    const bodyEl = el.querySelector(".body");
    entry = { el, body: bodyEl, sender, role, persona };
    _activeBubbles.set(streamId, entry);
    _senderStreamId.set(sender, streamId);
  }

  // Append token
  const cursor = entry.body.querySelector(".cursor");
  if (cursor) cursor.remove();
  entry.body.appendChild(document.createTextNode(text));
  // Re-add blinking cursor at the end
  const c = document.createElement("span");
  c.className = "cursor";
  entry.body.appendChild(c);

  const streamEl = $("#stream");
  streamEl.scrollTop = streamEl.scrollHeight;
}

/**
 * Create a message element without appending it to the stream.
 * Shared by handleStreamChunk and addMessage.
 */
function _createMsgEl(sender, role, persona) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${roleClass(role)}`;
  const head = document.createElement("div");
  head.className = "head";
  const badge = persona ? `<span class="badge">${escapeHtml(persona)}</span>` : "";
  head.innerHTML = `<span class="tag"></span><span>${escapeHtml(senderLabel(sender, role))}</span>${badge}`;
  const body = document.createElement("div");
  body.className = "body";
  if (role !== "system") wrap.appendChild(head);
  wrap.appendChild(body);
  return wrap;
}

/**
 * If this final message was pre-streamed, finalize the existing bubble.
 * Otherwise create a fresh bubble as normal.
 */
function finalizeOrAddMessage(m) {
  const isStreamed = m.meta && m.meta.streamed;
  if (isStreamed) {
    const streamId = _senderStreamId.get(m.sender);
    const entry = streamId ? _activeBubbles.get(streamId) : null;
    if (entry) {
      // Remove the blinking cursor — streaming is done
      const cursor = entry.body.querySelector(".cursor");
      if (cursor) cursor.remove();
      entry.el.removeAttribute("data-streaming");
      // Overwrite with the authoritative final text (handles cases where
      // buffering caused chunk reordering or the model added trailing content)
      const finalText = m.text || "";
      if (finalText && finalText !== entry.body.textContent) {
        entry.body.textContent = finalText;
      }
      // Update head badge if persona arrived only in the final message
      const persona = (m.meta && m.meta.persona) || "";
      if (persona) {
        const badge = entry.el.querySelector(".badge");
        if (badge) badge.textContent = persona;
        else {
          const head = entry.el.querySelector(".head");
          if (head) {
            const b = document.createElement("span");
            b.className = "badge";
            b.textContent = persona;
            head.appendChild(b);
          }
        }
      }
      // Decorate verdict status if present
      if (m.meta && m.meta.status) {
        const statusColor = m.meta.status === "done" ? "var(--ok)" :
                            m.meta.status === "failed" ? "var(--danger)" : "var(--warn)";
        const vTag = document.createElement("span");
        vTag.className = "badge";
        vTag.style.cssText = `background:color-mix(in srgb,${statusColor} 15%,transparent);color:${statusColor}`;
        vTag.textContent = m.meta.status;
        const head = entry.el.querySelector(".head");
        if (head) head.appendChild(vTag);
      }
      _activeBubbles.delete(streamId);
      _senderStreamId.delete(m.sender);
      return;
    }
  }
  // Not streamed (or no matching bubble found) — normal path
  addMessage(m);
}

function renderChats() {
  const list = $("#chatList");
  list.innerHTML = "";
  if (!state.chats.length) {
    list.innerHTML = `<div class="empty" style="padding:24px 6px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg>
      No missions yet</div>`;
    return;
  }
  state.chats.forEach((c) => {
    const item = document.createElement("div");
    item.className = "chat-item" + (c.id === state.chatId ? " active" : "");
    item.innerHTML = `<div class="t">${escapeHtml(c.title)}</div>
      <div class="m">${c.count} message${c.count === 1 ? "" : "s"}</div>
      <button class="del">Delete</button>`;
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("del")) return;
      openChat(c.id);
    });
    item.querySelector(".del").addEventListener("click", async (e) => {
      e.stopPropagation();
      await api.deleteChat(c.id);
      if (c.id === state.chatId) {
        state.chatId = null;
        clearStream(true);
        $("#chatTitle").textContent = "Select a conversation or start a new one";
        $("#chatSub").textContent = "Multi-model agent command center";
      }
      refreshChats();
    });
    list.appendChild(item);
  });
}

function renderWorkers() {
  const box = $("#workers");
  box.innerHTML = "";
  const count = $("#teamN");
  if (count) count.textContent = state.workers.length;

  if (!state.workers.length) {
    box.innerHTML = `<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
      No workers online yet</div>`;
  }

  state.workers.forEach((w) => {
    const stateCls = !w.ready ? "off" : w.busy ? "busy" : "idle";
    const stateTxt = !w.ready ? "Offline" : w.busy ? "Working" : "Available";
    const isScout = w.role === "scout";
    const initial = isScout ? "S" : (w.id.match(/\d+/) ? w.id.match(/\d+/)[0] : "E");
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <div class="row">
        <span class="avatar ${isScout ? "scout-av" : "exec-av"}">${initial}</span>
        <span class="name">${escapeHtml(w.id)}</span>
        <span class="role">${isScout ? "Analyst" : "Executor"}</span>
        <span class="st ${stateCls}">${stateTxt}</span>
      </div>
      ${w.current_task ? `<div class="task"><span class="dot" style="color:var(--accent)">&#9654;</span><span>${escapeHtml(w.current_task)}</span></div>` : ""}
      ${w.held_locks && w.held_locks.length ? `<div class="locks">&#128274; ${escapeHtml(w.held_locks.join(", "))}</div>` : ""}`;
    box.appendChild(el);
  });

  buildTargetMenu();
}

function renderPersonas() {
  const box = $("#pane-personas");
  if (!box) return;
  if (!state.personas.length) {
    box.innerHTML = `<div class="empty">No personas available</div>`;
    return;
  }
  box.innerHTML = "";
  state.personas.forEach((p) => {
    const color = p.color || personaColor(p.id);
    const name = p.name || p.name_en || p.id;
    const initial = name.charAt(0).toUpperCase();
    const roles = p.roles || [p.id];
    const skills = p.skills || [];
    const isHybrid = p.hybrid || roles.length > 1;

    // Role badges
    const roleBadgesHtml = roles.map((r) =>
      `<span class="role-badge" style="color:${personaColor(r)};border-color:color-mix(in srgb,${personaColor(r)} 35%,transparent);background:color-mix(in srgb,${personaColor(r)} 10%,transparent)">${escapeHtml(r)}</span>`
    ).join("");

    // Skill chips (show installed status)
    const skillChipsHtml = skills.map((s) => {
      const slug = typeof s === "string" ? s : s.slug;
      const installed = typeof s === "object" ? s.installed : true;
      const dotClass = installed ? "dot-ok" : "dot-miss";
      const title = (typeof s === "object" && s.description) ? s.description : slug;
      return `<span class="skill-chip" title="${escapeHtml(title)}"><span class="${dotClass}"></span>${escapeHtml(slug)}</span>`;
    }).join("");

    const el = document.createElement("div");
    el.className = "card persona-card";
    el.innerHTML = `
      <div class="row">
        <span class="avatar" style="background:${color};color:#fff">${initial}</span>
        <span class="name">${escapeHtml(name)}</span>
        ${isHybrid ? `<span class="hybrid-tag">Hybrid</span>` : ""}
      </div>
      <div class="role-badges">${roleBadgesHtml}</div>
      <div class="summary">${escapeHtml(p.summary || "")}</div>
      <div class="model"><b>Model:</b> ${escapeHtml(p.model_key || "")}</div>
      ${skillChipsHtml ? `<div class="skill-chips">${skillChipsHtml}</div>` : ""}`;
    box.appendChild(el);
  });
}

function renderLocks(locks) {
  const box = $("#pane-locks");
  const entries = Object.entries((locks && locks.locks) || {});
  const lockN = $("#lockN");
  if (lockN) lockN.textContent = entries.length;
  if (!entries.length) {
    box.innerHTML = `<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      No files are locked right now.</div>`;
    return;
  }
  box.innerHTML = "";
  entries.forEach(([file, info]) => {
    const waiters = (locks.waiters && locks.waiters[file]) || [];
    const row = document.createElement("div");
    row.className = "lock-row";
    row.innerHTML = `<div class="f">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>${escapeHtml(file)}</span> &mdash; <b>${escapeHtml(info.owner)}</b>
      </div>` +
      (waiters.length ? `<small>Waiting: ${escapeHtml(waiters.join(", "))}</small>` : "");
    box.appendChild(row);
  });
}

function renderAudit() {
  const box = $("#pane-audit");
  if (!box) return;
  if (!state.audit.length) {
    box.innerHTML = `<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/></svg>
      No activity recorded yet.</div>`;
    return;
  }
  box.innerHTML = "";
  state.audit.forEach((row) => {
    const actor = row.actor || row.who || row.agent || "system";
    const action = row.action || row.event || "";
    const detail = row.detail || row.target || row.message || row.path || "";
    const ts = row.ts || row.time || row.timestamp;
    const el = document.createElement("div");
    el.className = "audit-row";
    el.innerHTML = `<span class="a">${escapeHtml(actor)}</span>
      <span class="d"><b>${escapeHtml(action)}</b>${detail ? " · " + escapeHtml(detail) : ""}</span>
      ${ts ? `<span class="t">${escapeHtml(relTime(ts))}</span>` : ""}`;
    box.appendChild(el);
  });
}

async function refreshAudit() {
  try {
    const data = await api.audit();
    state.audit = Array.isArray(data) ? data.slice().reverse() : (data.entries || []);
    renderAudit();
  } catch (_) {}
}

// ---- live trace pane --------------------------------------------------------
const traceEvents = [];
const MAX_TRACE = 200;

const STAGE_LABELS = {
  task_start: "Task Start", llm_call: "LLM Call", attempt: "Attempt",
  attempt_ok: "Attempt OK", attempt_fail: "Attempt Failed", verdict: "Verdict",
  lock_wait: "Lock Wait", lock_acquired: "Lock Acquired", lock_skipped: "Lock Skipped",
  worktree: "Worktree", worktree_merge: "Worktree Merge", worker_restart: "Worker Restart",
  scout_start: "Scout Start", scout_done: "Scout Done", review_start: "Review Start",
  mission_resume: "Mission Resume",
};

function formatTraceTs(ts) {
  if (!ts) return "";
  const d = new Date(ts * (ts < 1e12 ? 1000 : 1));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function addTraceEvent(ev) {
  traceEvents.push(ev);
  if (traceEvents.length > MAX_TRACE) traceEvents.shift();

  // Update counter badge
  const n = $("#traceN");
  if (n) n.textContent = traceEvents.length;

  // Flash live dots
  const dot1 = $("#traceLiveDot"), dot2 = $("#traceLiveDot2");
  [dot1, dot2].forEach((d) => { if (d) { d.style.display = "inline-block"; } });

  // Only render if trace pane is active
  if ($("#pane-trace").classList.contains("active")) {
    appendTraceRow(ev);
  }
}

function appendTraceRow(ev) {
  const list = $("#traceList");
  if (!list) return;
  const stage = ev.stage || "unknown";
  const label = STAGE_LABELS[stage] || stage.replace(/_/g, " ").toUpperCase();
  const workerColor = ev.persona ? personaColor(ev.persona) : "var(--accent)";

  const skillsHtml = (ev.skills || []).slice(0, 4).map((s) =>
    `<span class="trace-skill">${escapeHtml(s)}</span>`
  ).join("") + (ev.skills && ev.skills.length > 4 ? `<span class="trace-skill">+${ev.skills.length - 4}</span>` : "");

  const rolesHtml = (ev.roles || []).map((r) =>
    `<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:color-mix(in srgb,${personaColor(r)} 15%,transparent);color:${personaColor(r)};font-weight:700">${escapeHtml(r)}</span>`
  ).join(" ");

  const row = document.createElement("div");
  row.className = `trace-row ${escapeHtml(stage)}`;
  row.innerHTML = `
    <div class="trace-meta">
      <div class="trace-stage">
        <span class="trace-worker" style="color:${workerColor}">${escapeHtml(ev.worker || "system")}</span>
        ${escapeHtml(label)}
        ${rolesHtml}
      </div>
      <div class="trace-detail">${escapeHtml(ev.detail || "")}</div>
      ${skillsHtml ? `<div class="trace-skills">${skillsHtml}</div>` : ""}
    </div>
    <span class="trace-ts">${formatTraceTs(ev.ts)}</span>`;
  list.appendChild(row);
  // Auto-scroll to bottom
  list.scrollTop = list.scrollHeight;
}

function renderAllTrace() {
  const list = $("#traceList");
  if (!list) return;
  list.innerHTML = "";
  traceEvents.forEach(appendTraceRow);
}

async function loadTraceHistory() {
  try {
    const data = await api.trace();
    if (Array.isArray(data) && data.length) {
      data.forEach((ev) => {
        traceEvents.push(ev);
        if (traceEvents.length > MAX_TRACE) traceEvents.shift();
      });
      const n = $("#traceN");
      if (n) n.textContent = traceEvents.length;
      renderAllTrace();
    }
  } catch (_) {}
}

// ---- tabs ------------------------------------------------------------------
function initTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.tab;
      $$(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      $$(".tab-pane").forEach((p) => p.classList.toggle("active", p.id === `pane-${id}`));
      if (id === "audit") refreshAudit();
      if (id === "trace") renderAllTrace();
    });
  });
}

// ---- settings drawer -------------------------------------------------------
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

function openDrawer() { $("#drawer").classList.add("open"); $("#scrim").classList.add("open"); }
function closeDrawer() { $("#drawer").classList.remove("open"); $("#scrim").classList.remove("open"); }

async function loadSettings() {
  const body = $("#settingsBody");
  body.innerHTML = `<div class="empty" style="padding:40px 0">Loading…</div>`;
  let data;
  try { data = await api.settings(); }
  catch (_) { body.innerHTML = `<div class="empty">Failed to load settings.</div>`; return; }

  const groups = data.groups || [];
  const fields = data.fields || [];
  body.innerHTML = "";
  groups.forEach((g) => {
    const groupFields = fields.filter((f) => f.group === g.id);
    if (!groupFields.length) return;
    const sec = document.createElement("div");
    sec.className = "set-group";
    sec.innerHTML = `<div class="gl">${escapeHtml(g.label)}</div>`;
    groupFields.forEach((f) => {
      const fieldEl = document.createElement("div");
      fieldEl.className = "set-field";
      let ctrl = "";
      if (f.type === "bool") {
        ctrl = `<div class="toggle ${f.value ? "on" : ""}" data-key="${escapeHtml(f.key)}" data-type="bool" role="switch" aria-checked="${f.value ? "true" : "false"}"></div>`;
      } else if (f.type === "int" || f.type === "float") {
        const step = f.type === "float" ? "0.1" : "1";
        const mn = f.min != null ? `min="${f.min}"` : "";
        const mx = f.max != null ? `max="${f.max}"` : "";
        ctrl = `<input type="number" step="${step}" ${mn} ${mx} value="${escapeHtml(f.value)}" data-key="${escapeHtml(f.key)}" data-type="${f.type}" />`;
      } else {
        ctrl = `<input type="text" value="${escapeHtml(f.value)}" data-key="${escapeHtml(f.key)}" data-type="model" />`;
      }
      fieldEl.innerHTML = `<label>${escapeHtml(f.label)}</label><div class="ctrl">${ctrl}</div>`;
      sec.appendChild(fieldEl);
    });
    body.appendChild(sec);
  });

  body.querySelectorAll(".toggle").forEach((t) => {
    t.addEventListener("click", () => {
      const on = t.classList.toggle("on");
      t.setAttribute("aria-checked", on ? "true" : "false");
    });
  });
}

function collectSettings() {
  const values = {};
  $("#settingsBody").querySelectorAll("[data-key]").forEach((el) => {
    const key = el.dataset.key;
    const type = el.dataset.type;
    if (type === "bool") values[key] = el.classList.contains("on");
    else if (type === "int") values[key] = parseInt(el.value, 10);
    else if (type === "float") values[key] = parseFloat(el.value);
    else values[key] = el.value;
  });
  return values;
}

// ---- actions ---------------------------------------------------------------
async function refreshChats() {
  state.chats = await api.listChats();
  renderChats();
}

async function openChat(id) {
  const chat = await api.getChat(id);
  state.chatId = id;
  $("#chatTitle").textContent = chat.title;
  const n = (chat.messages || []).length;
  $("#chatSub").textContent = `${n} message${n === 1 ? "" : "s"} in this mission`;
  clearStream(false);
  if (!n) clearStream(true);
  (chat.messages || []).forEach(addMessage);
  renderChats();
}

async function newChat() {
  const chat = await api.createChat();
  state.chatId = chat.id;
  clearStream(true);
  $("#chatTitle").textContent = chat.title;
  $("#chatSub").textContent = "New mission — ready to start";
  await refreshChats();
}

async function send() {
  const ta = $("#input");
  const text = ta.value.trim();
  if (!text) return;
  if (!state.chatId) await newChat();
  const to = state.targetValue;
  const skills = [...state.hybridSkills];
  ta.value = "";
  ta.style.height = "auto";
  await api.send(text, to, skills);
}

// ---- websocket live updates ------------------------------------------------
function connectWS() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    if (data.type === "message") {
      finalizeOrAddMessage(data);
      refreshChats();
      if ($("#pane-audit").classList.contains("active")) refreshAudit();
    } else if (data.type === "stream") {
      handleStreamChunk(data);
    } else if (data.type === "trace") {
      addTraceEvent(data);
    } else if (data.type === "state") {
      state.workers = data.workers || [];
      renderWorkers();
      renderLocks(data.locks);
      if (typeof data.turn === "number") {
        const pill = $("#turnPill");
        if (pill) pill.textContent = `Turn ${data.turn}`;
      }
    }
  };
  ws.onclose = () => {
    if (shuttingDown) { showStoppedOverlay(); return; }
    setTimeout(connectWS, 1500);
  };
}

// ---- event wiring ----------------------------------------------------------
$("#newChat").addEventListener("click", newChat);
$("#send").addEventListener("click", send);
$("#addExec").addEventListener("click", () => api.addExecutor());

$("#settingsBtn").addEventListener("click", () => { openDrawer(); loadSettings(); });
$("#drawerClose").addEventListener("click", closeDrawer);
$("#cancelSettings").addEventListener("click", closeDrawer);
$("#scrim").addEventListener("click", closeDrawer);
$("#saveSettings").addEventListener("click", async () => {
  const btn = $("#saveSettings");
  const values = collectSettings();
  try {
    await api.saveSettings(values);
    btn.classList.add("saved");
    btn.textContent = "Saved";
    toast("Settings saved — applied on the next task");
    setTimeout(() => { btn.classList.remove("saved"); btn.textContent = "Save settings"; }, 1600);
  } catch (_) {
    toast("Failed to save settings");
  }
});

// ---- clear trace -----------------------------------------------------------
const clearTraceBtn = $("#clearTrace");
if (clearTraceBtn) {
  clearTraceBtn.addEventListener("click", () => {
    traceEvents.length = 0;
    const list = $("#traceList");
    if (list) list.innerHTML = "";
    const n = $("#traceN");
    if (n) n.textContent = "0";
  });
}

let shuttingDown = false;
$("#shutdownBtn").addEventListener("click", async () => {
  if (!confirm("This will stop the server and all workers. Are you sure?")) return;
  shuttingDown = true;
  try { await api.shutdown(); } catch (_) {}
  showStoppedOverlay();
});

function showStoppedOverlay() {
  if ($("#stoppedOverlay")) return;
  const el = document.createElement("div");
  el.id = "stoppedOverlay";
  el.innerHTML = `
    <div class="stopped-card">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
      <h3>Server stopped</h3>
      <p>The server and all workers have been shut down. You can close this page or restart the system from your terminal.</p>
    </div>`;
  document.body.appendChild(el);
}

$("#input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
});
$("#input").addEventListener("input", (e) => {
  const ta = e.target;
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
});

// ---- init ------------------------------------------------------------------
(async function init() {
  initDropdowns();
  initTabs();
  clearStream(true);
  await refreshChats();

  try { state.personas = await api.personas(); }
  catch (_) { state.personas = []; }
  renderPersonas();
  buildHybridChecks();

  const s = await api.state();
  state.workers = s.workers || [];
  renderWorkers();
  renderLocks(s.locks);
  if (typeof s.turn === "number") $("#turnPill").textContent = `Turn ${s.turn}`;

  // Pre-load trace history from server (events from before page load)
  await loadTraceHistory();

  connectWS();
})();
