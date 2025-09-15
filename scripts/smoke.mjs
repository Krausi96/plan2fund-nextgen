import fs from "fs";
import path from "path";

const fail = (msg) => { console.error("SMOKE FAIL:", msg); process.exit(1); };
const warn = (msg) => { console.warn("SMOKE WARN:", msg); };
const ok   = (msg) => console.log("SMOKE OK:", msg);
const exists = (p) => fs.existsSync(p);

const ROOT = process.cwd();

// 1) Check docs presence
const master = path.join(ROOT, "docs", "Plan2Fund_MASTER.md");
const indexJson = path.join(ROOT, "docs", "_index.json");
if (!exists(master)) fail("docs/Plan2Fund_MASTER.md missing");
if (!exists(indexJson)) fail("docs/_index.json missing");
ok("Docs present");

// 2) Wizard universals ≤10, overlays ≤3 (best-effort)
let universalsCount = null;
let overlaysOK = true;

const qPath = path.join(ROOT, "data", "questions.json");
const overlayPath = path.join(ROOT, "data", "overlayQuestions.json");

if (exists(qPath)) {
  const q = JSON.parse(fs.readFileSync(qPath, "utf8"));
  if (Array.isArray(q.universal)) universalsCount = q.universal.length;
  else if (Array.isArray(q.groups)) universalsCount = q.groups.length;
  else if (Array.isArray(q)) universalsCount = q.length;
  if (universalsCount == null) warn("Could not infer universal question count from data/questions.json");
} else {
  warn("data/questions.json not found; skipping universal count check");
}

if (universalsCount != null && universalsCount > 10) {
  fail(`Universal questions exceed 10 (found ${universalsCount})`);
} else if (universalsCount != null) {
  ok(`Universal questions count = ${universalsCount} (≤10)`);
}

function checkOverlayFile(p) {
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const groups = Array.isArray(raw) ? raw : (raw.overlays || raw.groups || raw);
  let flagged = false;
  if (typeof groups === "object" && groups) {
    for (const [k, v] of Object.entries(groups)) {
      const len = Array.isArray(v) ? v.length : (Array.isArray(v?.questions) ? v.questions.length : null);
      if (len != null && len > 3) {
        console.error(`Overlay group '${k}' has ${len} (>3)`);
        flagged = true;
      }
    }
  }
  return !flagged;
}

if (exists(overlayPath)) {
  overlaysOK = checkOverlayFile(overlayPath);
} else if (exists(qPath)) {
  try { overlaysOK = checkOverlayFile(qPath); } catch { warn("Could not evaluate overlays from questions.json"); }
} else {
  warn("No overlay source found; skipping overlay check");
}

if (!overlaysOK) fail("One or more overlay groups exceed 3 questions");
else ok("Overlay groups within limit or skipped with warning");

// 3) Both Wizard & AI Intake import the SAME scoring engine
const wiz = path.join(ROOT, "src", "components", "reco", "Wizard.tsx");
const intake = path.join(ROOT, "src", "components", "reco", "AIIntake.tsx");
const scoringRe = /decisionTreeScoring/;

let wizUses = false, intakeUses = false;
if (exists(wiz)) wizUses = scoringRe.test(fs.readFileSync(wiz, "utf8"));
if (exists(intake)) intakeUses = scoringRe.test(fs.readFileSync(intake, "utf8"));
if (!wizUses || !intakeUses) {
  warn("Could not confirm both Wizard and AI Intake use decisionTreeScoring.ts (check imports).");
} else {
  ok("Wizard & AI Intake reference decisionTreeScoring (parity likely).");
}

// 4) Results debug shows mapping cues
const results1 = path.join(ROOT, "pages", "results.tsx");
const results2 = path.join(ROOT, "pages", "results", "index.tsx");
const rPath = exists(results1) ? results1 : (exists(results2) ? results2 : null);
if (!rPath) warn("Results page not found; skipping debug text check");
else {
  const s = fs.readFileSync(rPath, "utf8");
  const hasDebug = s.includes("Why this program appears") || s.includes("Decision details") || s.toLowerCase().includes("debug");
  if (!hasDebug) fail("Results debug mapping text not found");
  ok("Results debug mapping text present");
}

console.log("Smoke checks completed.");
