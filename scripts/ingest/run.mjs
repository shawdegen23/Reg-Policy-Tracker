import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scrapeCARB } from "./carb.mjs";
import { scrapeCEC } from "./cec.mjs";
import { scrapeLegiScan } from "./legiscan.mjs";
import { scrapeCPUC } from "./cpuc.mjs";
import { analyze, synthesize, impactText } from "./analyze.mjs";
import { aiEnrich, aiBrief, aiEnabled } from "./ai.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "..", "data");

async function readJson(f, fallback) {
  try { return JSON.parse(await readFile(join(DATA, f), "utf8")); }
  catch { return fallback; }
}
async function writeJson(f, obj) {
  await writeFile(join(DATA, f), JSON.stringify(obj, null, 2) + "\n");
}

function keyOf(d) {
  return (d.url || `${d.source}|${d.headline}`).toLowerCase();
}

// Merge new items into existing, keeping first-seen date, capping history.
function mergeDevelopments(existing, incoming) {
  const map = new Map();
  for (const d of existing) map.set(keyOf(d), d);
  const now = new Date().toISOString().slice(0, 10);
  for (const d of incoming) {
    const k = keyOf(d);
    if (map.has(k)) {
      const prev = map.get(k);
      map.set(k, { ...prev, ...d, firstSeen: prev.firstSeen || now, date: d.date || prev.date });
    } else {
      map.set(k, { ...d, firstSeen: now, date: d.date || now });
    }
  }
  return Array.from(map.values())
    .sort((a, z) => (z.date || z.firstSeen || "").localeCompare(a.date || a.firstSeen || ""))
    .slice(0, 500);
}

async function run() {
  const proceedings = await readJson("proceedings.json", []);
  let developments = await readJson("developments.json", []);
  const meta = await readJson("meta.json", { sources: {} });
  meta.sources = meta.sources || {};
  const nowIso = new Date().toISOString();

  const runners = [
    ["cpuc", () => scrapeCPUC(proceedings)],
    ["cec", () => scrapeCEC()],
    ["carb", () => scrapeCARB()],
  ];

  let allNew = [];
  for (const [name, fn] of runners) {
    try {
      const items = await fn();
      allNew = allNew.concat(items);
      meta.sources[name] = { lastRun: nowIso, status: "ok", count: items.length };
      console.log(`${name}: ${items.length} items`);
    } catch (e) {
      meta.sources[name] = { lastRun: nowIso, status: e.skipped ? "pending" : "error", count: 0, error: e.message };
      console.error(`${name} failed: ${e.message}`);
    }
  }
  // Map each tracked docket to its proceeding topic + relevance so CPUC filings
  // inherit the proceeding's priority instead of scoring Low on a bare "COMMENTS".
  const metaByDocket = Object.fromEntries(
    proceedings.filter((p) => p.docket && p.docket !== "CONFIRM #")
      .map((p) => [p.docket, { topic: p.topic, relevance: p.relevance }])
  );
  allNew = allNew
    .map(analyze) // rule-based baseline: topic, qual/quant, relevance, impact
    .map((d) => {
      const m = metaByDocket[d.docket];
      if (!m) return d;
      const topic = m.topic || d.topic;
      const relevance = m.relevance && m.relevance !== "Monitor" ? m.relevance : d.relevance;
      return { ...d, topic, relevance, impact: impactText(topic, d.type, d.agency, d.dataType, relevance) };
    });

  // Optional AI overlay: real impact summaries + relevance (falls back silently).
  if (aiEnabled()) {
    try {
      allNew = await aiEnrich(allNew);
      console.log("AI enrichment applied to new items.");
    } catch (e) {
      console.error(`AI enrichment skipped: ${e.message}`);
    }
  }

  developments = mergeDevelopments(developments, allNew);
  // Backfill analysis on any older items that predate the analysis layer.
  developments = developments.map((d) => (d.topic ? d : analyze(d)));

  // Bills (separate file)
  try {
    const bills = await scrapeLegiScan();
    await writeJson("bills.json", bills);
    meta.sources.legiscan = { lastRun: nowIso, status: "ok", count: bills.length };
    console.log(`legiscan: ${bills.length} bills`);
  } catch (e) {
    meta.sources.legiscan = { lastRun: nowIso, status: e.skipped ? "pending" : "error", count: 0, error: e.message };
    console.error(`legiscan: ${e.message}`);
  }

  meta.lastRun = nowIso;
  await writeJson("developments.json", developments);
  await writeJson("meta.json", meta);

  // Director Brief synthesis (rule-based rollup + optional AI narrative)
  const brief = synthesize(developments, proceedings);
  if (aiEnabled()) {
    try {
      const narrative = await aiBrief(developments);
      if (narrative) brief.narrative = narrative;
      console.log("AI Director narrative generated.");
    } catch (e) {
      console.error(`AI narrative skipped: ${e.message}`);
    }
  }
  await writeJson("brief.json", brief);

  console.log(`Done. ${developments.length} developments total; ${brief.totals.high} high-relevance.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
