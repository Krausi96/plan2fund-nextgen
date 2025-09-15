import fs from "fs";
import path from "path";

const fail = (m) => { console.error("SMOKE FAIL:", m); process.exit(1); };
const warn = (m) => console.warn("SMOKE WARN:", m);
const ok   = (m) => console.log("SMOKE OK:", m);
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8");

const ROOT = process.cwd();

// --- Required docs & index coherence ---
const indexPath = path.join(ROOT, "docs", "_index.json");
if (!exists(indexPath)) fail("docs/_index.json missing");
const index = JSON.parse(read(indexPath));

const requiredDocs = [
  "docs/Plan2Fund_MASTER.md",
  "docs/QuickStart.md",
  "docs/Architecture/Data_Map.md",
  "docs/Operations/Workflow.md",
  "docs/Operations/Agent_Boot.md",
  "docs/mappings/DECISION_TREE_MAPPING.md"
];

for (const f of requiredDocs) {
  if (!exists(path.join(ROOT, f))) fail(`Required doc missing: ${f}`);
}
ok("All required docs exist");

function indexLists(file) {
  const { master, quickstart, architecture, operations, mappings } = index;
  const flat = [
    master, quickstart,
    ...(architecture || []),
    ...(operations || []),
    ...(mappings || [])
  ].filter(Boolean);
  return flat.includes(file);
}

for (const f of requiredDocs) {
  if (!indexLists(f)) fail(`docs/_index.json does not reference: ${f}`);
}
ok("_index.json references all required docs");

if (!index.anchors || !index.anchors.journey || !index.anchors.scoring) {
  fail("docs/_index.json missing required anchors (journey, scoring)");
}
ok("Anchors present in _index.json");

// --- README ToC sanity (non-strict) ---
const readmePath = path.join(ROOT, "docs", "README.md");
if (exists(readmePath)) {
  const r = read(readmePath);
  const mustLink = [
    "Plan2Fund_MASTER.md",
    "QuickStart.md",
    "Architecture/Data_Map.md",
    "Operations/Workflow.md"
  ];
  let missing = [];
  for (const m of mustLink) {
    if (!r.includes(m)) missing.push(m);
  }
  if (missing.length) warn("README.md missing links: " + missing.join(", "));
  else ok("README links look good");
} else {
  warn("docs/README.md not found; ToC check skipped");
}

// --- Wizard/Intake invariants (best-effort) ---
function safeJSON(p){ try { return JSON.parse(read(p)); } catch { return null; } }

const qPath = path.join(ROOT, "data", "questions.json");
const overlayPath = path.join(ROOT, "data", "overlayQuestions.json");

let universalsCount = null;
if (exists(qPath)) {
  const q = safeJSON(qPath);
  if (q) {
    if (Array.isArray(q.universal)) universalsCount = q.universal.length;
    else if (Array.isArray(q.groups)) universalsCount = q.groups.length;
    else if (Array.isArray(q)) universalsCount = q.length;
  }
}
if (universalsCount != null && universalsCount > 10) fail(`Universal questions exceed 10 (found ${universalsCount})`);
if (universalsCount != null) ok(`Universal questions count = ${universalsCount} (≤10)`);

function checkOverlays(p) {
  const raw = safeJSON(p);
  if (!raw) return true;
  const groups = Array.isArray(raw) ? raw : (raw.overlays || raw.groups || raw);
  let okAll = true;
  if (groups && typeof groups === "object") {
    for (const [k,v] of Object.entries(groups)) {
      const len = Array.isArray(v) ? v.length : (Array.isArray(v?.questions) ? v.questions.length : null);
      if (len != null && len > 3) { console.error(`Overlay group '${k}' has ${len} (>3)`); okAll = false; }
    }
  }
  return okAll;
}
if (exists(overlayPath) && !checkOverlays(overlayPath)) fail("Overlay groups exceed 3 questions");
ok("Overlay groups within limits or skipped");

// --- Scoring engine parity check (import usage) ---
const wiz = path.join(ROOT, "src", "components", "reco", "Wizard.tsx");
const intake = path.join(ROOT, "src", "components", "reco", "AIIntake.tsx");
const scoringRe = /decisionTreeScoring/;
const w = exists(wiz) ? read(wiz) : "";
const i = exists(intake) ? read(intake) : "";
if (!scoringRe.test(w) || !scoringRe.test(i)) warn("Parity not confirmed: ensure both use decisionTreeScoring.ts");
else ok("Wizard & AI Intake reference decisionTreeScoring");

// --- Results debug present ---
const results1 = path.join(ROOT, "pages", "results.tsx");
const results2 = path.join(ROOT, "pages", "results", "index.tsx");
const rPath = exists(results1) ? results1 : (exists(results2) ? results2 : null);
if (rPath) {
  const rs = read(rPath);
  const hasDebug = rs.includes("Why this program appears") || rs.includes("Decision details") || rs.toLowerCase().includes("debug");
  if (!hasDebug) fail("Results debug mapping text not found");
  ok("Results debug mapping found");
} else {
  warn("Results page not found; debug check skipped");
}

console.log("Smoke checks completed.");
