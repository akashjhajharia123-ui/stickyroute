import { selectRandom, selectSticky } from "./sticky.js";

const RULE_ID = "demo-split";
const STEP_MS = 70;
const REAL_GRID_ROWS = 40;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = id => document.getElementById(id);

/** @param {number} claudeShare percent 10..90 */
function buildTargets(claudeShare) {
  return [
    { provider: "anthropic", model: "claude", weight: claudeShare / 100, cls: "a" },
    { provider: "openai", model: "gpt", weight: (100 - claudeShare) / 100, cls: "b" },
  ];
}

/** Simulates every conversation in both modes; returns per-conversation lists of "a"/"b". */
function simulate(targets, conversations, turns) {
  const runId = Math.random().toString(36).slice(2, 10);
  const random = [];
  const sticky = [];
  for (let i = 0; i < conversations; i++) {
    const sessionId = `demo-${runId}-${i}`;
    const pinned = selectSticky(targets, `${sessionId}\0${RULE_ID}`);
    const randomTurns = [];
    for (let t = 0; t < turns; t++) randomTurns.push(selectRandom(targets).cls);
    random.push(randomTurns);
    sticky.push(Array(turns).fill(pinned.cls));
  }
  return { random, sticky };
}

/** @param {string[][]} rows */
function summarise(rows) {
  let switched = 0;
  let switches = 0;
  let startedOnA = 0;
  for (const row of rows) {
    let n = 0;
    for (let i = 1; i < row.length; i++) if (row[i] !== row[i - 1]) n++;
    switches += n;
    if (n > 0) switched++;
    if (row[0] === "a") startedOnA++;
  }
  return { switched, perConversation: switches / rows.length, shareA: startedOnA / rows.length };
}

function emptyGrid(container, rows, turns) {
  container.replaceChildren();
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = document.createElement("div");
    row.className = "row";
    row.style.gridTemplateColumns = `repeat(${turns}, 1fr)`;
    const rowCells = [];
    for (let t = 0; t < turns; t++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      row.append(cell);
      rowCells.push(cell);
    }
    container.append(row);
    cells.push(rowCells);
  }
  return cells;
}

function paintColumn(cells, rows, column) {
  rows.forEach((row, r) => { cells[r][column].className = `cell ${row[column]}`; });
}

function showStats(prefix, rows) {
  const s = summarise(rows);
  $(`${prefix}-switched`).textContent = `${s.switched} / ${rows.length}`;
  $(`${prefix}-per`).textContent = s.perConversation.toFixed(2);
  $(`${prefix}-share`).textContent = `${(s.shareA * 100).toFixed(0)}%`;
}

function clearStats(prefix) {
  for (const key of ["switched", "per", "share"]) $(`${prefix}-${key}`).textContent = "…";
}

async function runDemo(event) {
  event?.preventDefault();
  const share = Number($("share").value);
  const conversations = Number($("conversations").value);
  const turns = Number($("turns").value);
  const { random, sticky } = simulate(buildTargets(share), conversations, turns);
  const randomCells = emptyGrid($("grid-random"), conversations, turns);
  const stickyCells = emptyGrid($("grid-sticky"), conversations, turns);
  clearStats("random");
  clearStats("sticky");
  $("run").disabled = true;
  for (let t = 0; t < turns; t++) {
    paintColumn(randomCells, random, t);
    paintColumn(stickyCells, sticky, t);
    if (!reduceMotion) await new Promise(resolve => setTimeout(resolve, STEP_MS));
  }
  showStats("random", random);
  showStats("sticky", sticky);
  $("run").disabled = false;
  $("demo-note").textContent =
    `Target split ${share}/${100 - share}. With sticky sessions, ${(summarise(sticky).shareA * 100).toFixed(0)}% of these ${conversations} conversations started on Claude and none switched. Run it again for new session IDs; with more conversations the split gets closer to your setting.`;
}

function kpi(label, value, small) {
  const box = document.createElement("dl");
  box.className = "kpi";
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value;
  if (small) {
    const s = document.createElement("small");
    s.textContent = small;
    dd.append(s);
  }
  box.append(dt, dd);
  return box;
}

function realGrid(title, caption, sample, turns) {
  const fig = document.createElement("figure");
  fig.className = "panel";
  const cap = document.createElement("figcaption");
  const h3 = document.createElement("h3");
  h3.textContent = title;
  const p = document.createElement("p");
  p.textContent = caption;
  cap.append(h3, p);
  const grid = document.createElement("div");
  grid.className = "grid";
  grid.setAttribute("role", "img");
  grid.setAttribute("aria-label", `${title}: provider per message for ${sample.length} conversations`);
  const rows = sample.map(s => [...s].map(c => (c === "A" ? "a" : "b")));
  const cells = emptyGrid(grid, rows.length, turns);
  for (let t = 0; t < turns; t++) paintColumn(cells, rows, t);
  fig.append(cap, grid);
  return fig;
}

async function loadRealResults() {
  try {
    const res = await fetch("data/routing-proof.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const byMode = Object.fromEntries(data.modes.map(m => [m.mode, m]));
    const turns = data.workload.turns_per_session;
    const random = byMode.random;
    const sticky = byMode.sticky;
    const pct = v => `${(v * 100).toFixed(1)}%`;
    $("kpis").replaceChildren(
      kpi("Bifrost today: conversations that switched", `${random.summary.sessions_with_any_switch} / ${random.sessions_total}`, `${random.summary.provider_switches_per_session} switches per conversation`),
      kpi("With sticky_sessions", `${sticky.summary.sessions_with_any_switch} / ${sticky.sessions_total}`, "0 switches per conversation"),
      kpi("Split with sticky_sessions", pct(sticky.summary.share_by_provider["upstream-a"]), `target 70%; errors ${pct(sticky.summary.error_rate)}`),
    );
    $("real-grids").replaceChildren(
      realGrid("Bifrost today", `First ${REAL_GRID_ROWS} of ${random.sessions_total} conversations`, random.sample.slice(0, REAL_GRID_ROWS), turns),
      realGrid("With sticky_sessions", `First ${REAL_GRID_ROWS} of ${sticky.sessions_total} conversations`, sticky.sample.slice(0, REAL_GRID_ROWS), turns),
    );
    $("stat-random").textContent = `${random.summary.sessions_with_any_switch} / ${random.sessions_total}`;
    $("stat-sticky").textContent = `${sticky.summary.sessions_with_any_switch} / ${sticky.sessions_total}`;
  } catch (err) {
    $("kpis").replaceChildren(kpi("Results could not be loaded", "–", err instanceof Error ? err.message : "unknown error"));
  }
}

$("share").addEventListener("input", e => { $("share-out").textContent = `${e.target.value}%`; });
$("controls").addEventListener("submit", runDemo);
loadRealResults();
runDemo();
