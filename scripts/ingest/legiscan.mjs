import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { isRelevant } from "./keywords.mjs";

// LegiScan REST API — free public key (https://legiscan.com/legiscan).
// Set LEGISCAN_API_KEY as a GitHub Actions secret. No key => returns [] gracefully.
//
// Good LegiScan citizenship (per their crash course):
//  - one getMasterList call per run for California (well under the 30k/mo limit)
//  - check "status" === "OK"
//  - use change_hash + a local cache to detect changes and avoid re-spending
//  - attribute LegiScan (shown in the app footer / Bills tab)
const KEY = process.env.LEGISCAN_API_KEY;
const CACHE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "legiscan_cache.json");

async function readCache() {
  try { return JSON.parse(await readFile(CACHE, "utf8")); } catch { return {}; }
}

export async function scrapeLegiScan() {
  if (!KEY) { const e = new Error("LEGISCAN_API_KEY not set"); e.skipped = true; throw e; }

  const res = await fetch(`https://api.legiscan.com/?key=${KEY}&op=getMasterList&state=CA`);
  if (!res.ok) throw new Error(`LegiScan HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK" || !data.masterlist) throw new Error("LegiScan bad response");

  const cache = await readCache();          // bill_id -> change_hash (last seen)
  const nextCache = {};
  const bills = [];

  for (const [k, b] of Object.entries(data.masterlist)) {
    if (k === "session") continue;
    nextCache[b.bill_id] = b.change_hash;    // record every bill's hash
    const text = `${b.number} ${b.title}`;
    if (!isRelevant(text)) continue;         // energy/climate only
    const prev = cache[b.bill_id];
    bills.push({
      number: b.number,
      title: b.title,
      lastAction: b.last_action || "",
      lastActionDate: b.last_action_date || "",
      status: String(b.status || ""),
      url: b.url || b.state_link || "",
      changeHash: b.change_hash,
      isNew: !prev,
      isUpdated: Boolean(prev && prev !== b.change_hash),
    });
  }

  // Persist hashes so future runs can skip unchanged bills / avoid extra spend.
  try { await writeFile(CACHE, JSON.stringify(nextCache) + "\n"); } catch {}

  bills.sort((a, z) => (z.lastActionDate || "").localeCompare(a.lastActionDate || ""));
  return bills.slice(0, 80);
}
