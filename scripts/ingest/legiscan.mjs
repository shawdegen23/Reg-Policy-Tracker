import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { isBillCandidate } from "./keywords.mjs";
import { aiClassifyBills } from "./ai.mjs";
import { fetchRetry } from "./http.mjs";

// LegiScan REST API — free public key (https://legiscan.com/legiscan).
// Set LEGISCAN_API_KEY as a GitHub Actions secret. No key => returns [] gracefully.
//
// Two-bucket relevance:
//   1) WIDE keyword net (isBillCandidate) — never miss an energy bill
//   2) AI relevance gate (aiClassifyBills) — decide which candidates truly belong
// The AI verdict is cached per bill keyed by change_hash, so each bill is judged
// once and only re-judged when it actually changes (minimal query/AI spend).
const KEY = process.env.LEGISCAN_API_KEY;
const CACHE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "legiscan_cache.json");

async function readCache() {
  try { return JSON.parse(await readFile(CACHE, "utf8")); } catch { return {}; }
}

// Legislative stage 0..4 (Introduced→Signed), -1 terminal-negative. Cached so we
// can detect stage CHANGES run-to-run (momentum), not just "something changed".
function billStage(status, lastAction) {
  const s = parseInt(status || "0", 10);
  const a = (lastAction || "").toLowerCase();
  if (s === 5 || s === 6 || a.includes("vetoed") || a.includes("died") || a.includes("failed")) return -1;
  if (s === 4 || a.includes("chaptered") || a.includes("approved by the governor")) return 4;
  if (s === 3 || a.includes("enrolled")) return 3;
  if (a.includes("third reading") || a.includes("do pass") || a.includes("passed") || s === 2) return 2;
  if (a.includes("committee") || a.includes("referred")) return 1;
  return 0;
}

export async function scrapeLegiScan() {
  if (!KEY) { const e = new Error("LEGISCAN_API_KEY not set"); e.skipped = true; throw e; }

  const res = await fetchRetry(`https://api.legiscan.com/?key=${KEY}&op=getMasterList&state=CA`);
  if (!res.ok) throw new Error(`LegiScan HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK" || !data.masterlist) throw new Error("LegiScan bad response");

  const cache = await readCache();        // bill_id -> { hash, relevant }
  const nextCache = {};

  // Bucket 1: wide candidates
  const candidates = [];
  for (const [k, b] of Object.entries(data.masterlist)) {
    if (k === "session") continue;
    if (!isBillCandidate(`${b.number} ${b.title}`)) continue;
    candidates.push(b);
  }

  // Reuse cached verdicts where hash is unchanged; classify the rest with AI.
  const toClassify = [];
  const verdict = new Map();               // bill_id -> boolean
  for (const b of candidates) {
    const prev = cache[b.bill_id];
    if (prev && prev.hash === b.change_hash && typeof prev.relevant === "boolean") {
      verdict.set(b.bill_id, prev.relevant);
    } else {
      toClassify.push(b);
    }
  }
  if (toClassify.length) {
    const keep = await aiClassifyBills(toClassify.map((b) => b.title));
    toClassify.forEach((b, idx) => verdict.set(b.bill_id, keep ? keep.has(idx) : true));
  }

  const bills = [];
  for (const b of candidates) {
    const relevant = verdict.get(b.bill_id) === true;
    const stage = billStage(b.status, b.last_action);
    const prev = cache[b.bill_id];
    nextCache[b.bill_id] = { hash: b.change_hash, relevant, stage };
    if (!relevant) continue;
    bills.push({
      number: b.number,
      title: b.title,
      lastAction: b.last_action || "",
      lastActionDate: b.last_action_date || "",
      status: String(b.status || ""),
      url: b.url || b.state_link || "",
      changeHash: b.change_hash,
      stage,
      prevStage: prev && typeof prev.stage === "number" ? prev.stage : null,
      isNew: !prev,
      isUpdated: Boolean(prev && prev.hash !== b.change_hash),
    });
  }

  try { await writeFile(CACHE, JSON.stringify(nextCache) + "\n"); } catch {}
  bills.sort((a, z) => (z.lastActionDate || "").localeCompare(a.lastActionDate || ""));
  return bills.slice(0, 100);
}
