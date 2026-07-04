import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PDFParse } from "pdf-parse";
import { fetchRetry } from "./http.mjs";
import { aiDeadlines } from "./ai.mjs";

// Deadline radar: reads the actual CPUC filing PDFs for high-signal documents
// (rulings, proposed decisions) and extracts comment windows / hearing dates.
// AI extraction with a regex fallback; caches processed docs to bound cost.
const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data");
const CACHE = join(DIR, "deadlines_cache.json");
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const MAX_DOCS = 12; // per run

function normDate(s) {
  const t = Date.parse(s);
  return isNaN(t) ? "" : new Date(t).toISOString().slice(0, 10);
}
const isFuture = (iso) => iso && Date.parse(iso) >= Date.now() - 86400000;

async function readJson(p, fb) { try { return JSON.parse(await readFile(p, "utf8")); } catch { return fb; } }

// Resolve a docs.cpuc.ca.gov SearchRes page to its actual PDF URL.
async function resolvePdf(url) {
  if (/\.pdf$/i.test(url)) return url;
  const res = await fetchRetry(url, { headers: { "User-Agent": UA } });
  const html = await res.text();
  const m = html.match(/https?:\/\/docs\.cpuc\.ca\.gov\/PublishedDocs\/\S+?\.PDF/i);
  return m ? m[0] : null;
}

async function pdfText(pdfUrl) {
  const res = await fetchRetry(pdfUrl, { headers: { "User-Agent": UA } }, { timeoutMs: 25000 });
  if (!res.ok) throw new Error(`PDF HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const r = await new PDFParse({ data: buf }).getText();
  return (r.text || "").replace(/\s+/g, " ").trim();
}

// Regex fallback — find dates tied to comment/hearing language.
function regexDeadlines(text) {
  const DATE = "([A-Z][a-z]+ \\d{1,2},? \\d{4})";
  const out = [];
  const push = (type, date) => { const iso = normDate(date); if (iso) out.push({ date: iso, type, description: `${type} (auto-detected)` }); };
  const scan = (re, type) => { let m; while ((m = re.exec(text))) push(type, m[m.length - 1]); };
  scan(new RegExp(`reply comments[^.]{0,140}?(?:no later than|due|shall be filed|on or before|by)\\s+${DATE}`, "gi"), "Reply Comments");
  scan(new RegExp(`opening comments[^.]{0,140}?(?:no later than|due|shall be filed|on or before|by)\\s+${DATE}`, "gi"), "Opening Comments");
  scan(new RegExp(`comments[^.]{0,120}?(?:no later than|due|shall be filed|on or before)\\s+${DATE}`, "gi"), "Comments");
  scan(new RegExp(`(?:hearing|prehearing conference|workshop)[^.]{0,90}?${DATE}`, "gi"), "Hearing/Workshop");
  return out;
}

export async function extractDeadlines(developments) {
  const cache = await readJson(CACHE, {});
  const existing = await readJson(join(DIR, "deadlines.json"), []);

  // High-signal CPUC docs that set schedules, recent, not yet processed.
  const candidates = developments
    .filter((d) => d.agency === "CPUC" && d.url && /Ruling|Proposed Decision|Decision/i.test(d.type))
    .filter((d) => { const g = (Date.now() - Date.parse(d.date || d.firstSeen)) / 86400000; return !isNaN(g) && g <= 75; })
    .filter((d) => !cache[d.url])
    .slice(0, MAX_DOCS);

  const fresh = [];
  for (const d of candidates) {
    try {
      const pdf = await resolvePdf(d.url);
      if (!pdf) { cache[d.url] = { done: true, at: new Date().toISOString() }; continue; }
      const text = await pdfText(pdf);
      let items = null;
      try { items = await aiDeadlines(d.headline, text); } catch (e) { console.error(`AI deadlines: ${e.message}`); }
      if (!items) items = regexDeadlines(text);
      for (const it of items || []) {
        const iso = normDate(it.date);
        if (!isFuture(iso)) continue;
        fresh.push({ date: iso, type: it.type || "Deadline", description: it.description || "", docket: d.docket, headline: d.headline, url: d.url, agency: "CPUC" });
      }
      cache[d.url] = { done: true, at: new Date().toISOString() };
      console.log(`deadlines ${d.docket}: ${(items || []).length} extracted`);
    } catch (e) {
      console.error(`deadlines ${d.docket}: ${e.message}`);
    }
  }

  // Merge with existing, keep only future, dedupe by (date|type|docket|url), sort ascending.
  const all = [...existing, ...fresh].filter((x) => isFuture(x.date));
  const seen = new Set();
  const merged = all.filter((x) => { const k = `${x.date}|${x.type}|${x.docket}|${x.url}`; return seen.has(k) ? false : (seen.add(k), true); })
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  await writeFile(join(DIR, "deadlines.json"), JSON.stringify(merged, null, 2) + "\n");
  await writeFile(CACHE, JSON.stringify(cache) + "\n");
  return merged;
}
