const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dataDir  = path.join(repoRoot, "data");
const regDir   = path.join(dataDir, "registry");
const programsPath = path.join(dataDir, "programs.json");

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (_) {
    return Array.isArray ? [] : {};
  }
}

function isNonEmpty(val) {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "object") return Object.keys(val).length > 0;
  if (typeof val === "string") return val.trim().length > 0;
  return true;
}

function unionArray(a = [], b = []) {
  return Array.from(new Set([...(a||[]), ...(b||[])]));
}

function mergeRecord(dst, src) {
  const arrayKeys = new Set([
    "region","sector","applicant_type","docs_required","deadlines","evidence_links","rule_groups"
  ]);
  for (const [k, v] of Object.entries(src)) {
    if (arrayKeys.has(k)) {
      dst[k] = unionArray(dst[k], v);
    } else if (!isNonEmpty(dst[k])) {
      dst[k] = v;
    }
  }
  return dst;
}

function sortPrograms(arr) {
  const key = (x) => [
    (x.category||""),
    (x.authority||""),
    (x.title||"")
  ].join("|").toLowerCase();
  return arr.sort((a,b) => key(a).localeCompare(key(b)));
}

// Load existing programs
let existing = readJsonSafe(programsPath);
if (!Array.isArray(existing)) existing = [];

// Load registries
const files = fs.readdirSync(regDir).filter(f => f.endsWith(".json"));
let regs = [];
for (const f of files) {
  const full = path.join(regDir, f);
  const parsed = readJsonSafe(full);
  if (Array.isArray(parsed)) regs.push(...parsed);
}

// Merge by id
const map = new Map();
for (const p of existing) map.set(p.id, { ...p });
for (const r of regs) {
  if (!r || !r.id) continue;
  const cur = map.get(r.id) || {};
  map.set(r.id, mergeRecord(cur, r));
}

// Write back
const merged = sortPrograms(Array.from(map.values()));
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(programsPath, JSON.stringify(merged, null, 2), "utf8");
console.log(`Merged ${files.length} registries -> ${merged.length} programs.`);
