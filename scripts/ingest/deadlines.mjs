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
const MAX_DOCS = 15; // per run

function normDate(s) {
  const t = Date.parse(s);
  return isNaN(t) ? "" : new Date(t).toISOString().slice(0, 10);
}
const isFuture = (iso) => iso && Date.parse(iso) >= Date.now() - 86400000;

async function readJson(p, fb) { try { return JSON.parse(await readFile(p, "utf8")); } catch { return fb; } }

// Resolve a docs.cpuc.ca.gov SearchRes page to its actual PDF URL. The page
// links the PDF as a RELATIVE path (/PublishedDocs/.../X.PDF), so prepend host.
async function resolvePdf(url) {
  if (/\.pdf$/i.test(url)) return url;
  const res = await fetchRetry(url, { headers: { "User-Agent": UA } });
  const html = await res.text();
  const m = html.match(/\/PublishedDocs\/[^\s"'<>]+?\.PDF/i);
  return m ? "https://docs.cpuc.ca.gov" + m[0] : null;
}

async function pdfText(pdfUrl) {
  const res = await fetchRetry(pdfUrl, { headers: { "User-Agent": UA } }, { timeoutMs: 25000 });
  if (!res.ok) throw new Error(`PDF HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const r = await new PDFParse({ data: buf }).getText();
  return (r.text || "").replace(/\s+/g, " ").trim();
}

// Regex fallback — scan every FUTURE date and classify it by the scheduling
// language in the ~140 chars before it. Catches phrasings like "reply comments
// to July 10, 2026" that keyword-anchored patterns miss.
function regexDeadlines(text) {
  const out = [];
  const dateRe = /([A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s+\d{4})/g;
  let m;
  while ((m = dateRe.exec(text))) {
    const iso = normDate(m[1]);
    if (!isFuture(iso)) continue;
    const ctx = text.slice(Math.max(0, m.index - 160), m.index + 30).toLowerCase();
    let type = null;
    if (/reply comment/.test(ctx)) type = "Reply Comments";
    else if (/opening comment/.test(ctx)) type = "Opening Comments";
    else if (/comment/.test(ctx) && /(due|no later|on or before|shall be filed|deadline|file|submit|extend)/.test(ctx)) type = "Comments";
    else if (/prehearing conference/.test(ctx)) type = "Prehearing Conference";
    else if (/\bhearing\b/.test(ctx)) type = "Hearing";
    else if (/workshop/.test(ctx)) type = "Workshop";
    else if (/(response|reply|protest)[^.]{0,40}(due|no later|on or before|shall be filed)/.test(ctx)) type = "Response";
    if (type) out.push({ date: iso, type, description: `${type} (auto-detected)` });
  }
  // dedupe by date+type
  const seen = new Set();
  return out.filter((x) => { const k = `${x.date}|${x.type}`; return seen.has(k) ? false : (seen.add(k), true); });
}

export async function extractDeadlines(developments) {
  const cache = await readJson(CACHE, {});
  const existing = await readJson(join(DIR, "deadlines.json"), []);

  // CPUC docs whose text may state a schedule — rulings/PDs set them, and comment
  // filings routinely restate the reply-comment deadline. Recent, not yet read.
  // Prioritize scheduling docs, then comments, then everything else.
  const priority = (d) => /Ruling|Proposed Decision/i.test(d.type) ? 0 : /Comment/i.test(d.type) ? 1 : 2;
  const candidates = developments
    .filter((d) => d.agency === "CPUC" && d.url && !cache[d.url])
    .filter((d) => { const g = (Date.now() - Date.parse(d.date || d.firstSeen)) / 86400000; return !isNaN(g) && g <= 75; })
    .sort((a, b) => priority(a) - priority(b))
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
  // One deadline per date+type+docket, even if many filings restate it.
  const seen = new Set();
  const merged = all.filter((x) => { const k = `${x.date}|${x.type}|${x.docket}`; return seen.has(k) ? false : (seen.add(k), true); })
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  await writeFile(join(DIR, "deadlines.json"), JSON.stringify(merged, null, 2) + "\n");
  await writeFile(CACHE, JSON.stringify(cache) + "\n");
  return merged;
}
