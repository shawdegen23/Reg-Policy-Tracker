import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DEBUG_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "cpuc_debug.json");

// CPUC docket system (apps.cpuc.ca.gov) is JavaScript-rendered — Playwright loads
// it in a real browser. We try the Documents tab (57) and fall back to the docket
// card (56), scan the page and any iframes for document links, and log diagnostics
// so selector tuning can be finalized from the GitHub Action logs.

const DOC_RE = /PublishedDocs|\.PDF|efile|Efile|SearchRes|docs\.cpuc\.ca\.gov/i;

function core(docket) { return docket.replace(/[.\-]/g, "").trim(); } // R.25-04-010 -> R2504010
const urls = (c) => [
  `https://apps.cpuc.ca.gov/apex/f?p=401:57:0::NO:RP,57,RIR:P5_PROCEEDING_SELECT:${c}`,
  `https://apps.cpuc.ca.gov/apex/f?p=401:56:0::NO:RP,57,RIR:P5_PROCEEDING_SELECT:${c}`,
];

async function extract(page) {
  // CPUC document rows are [Filing Date, Document Type(link), Filed By, Description].
  // The description/title is the LAST non-meta cell; the filer is the one before it.
  const grab = () => {
    const MONTH = /\b([A-Z][a-z]+ \d{1,2}, \d{4})\b/;   // "July 01, 2026"
    const SLASH = /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/;       // "07/01/2026"
    const out = [];
    for (const a of Array.from(document.querySelectorAll("a"))) {
      const href = a.href || "";
      const type = (a.textContent || "").trim(); // e.g. "COMMENTS", "RULING"
      if (!/PublishedDocs|\.PDF|efile|Efile|SearchRes|docs\.cpuc\.ca\.gov/i.test(href)) continue;
      const tr = a.closest("tr");
      let date = "", desc = "", filer = "";
      if (tr) {
        const cells = Array.from(tr.querySelectorAll("td,th")).map((c) => c.textContent.trim());
        for (const c of cells) { const m = c.match(MONTH) || c.match(SLASH); if (m) { date = m[1]; break; } }
        // Positional: columns are [Date, Type(link), Filed By, Description].
        let ti = cells.indexOf(type);
        if (ti === -1) ti = cells.findIndex((c) => MONTH.test(c) || SLASH.test(c)) + 1;
        filer = cells[ti + 1] || "";
        desc = cells[ti + 2] || "";
        // Fallback if layout differs: longest remaining cell as description.
        if (!desc) {
          const rest = cells.filter((c) => c && c !== type && c !== filer && !MONTH.test(c) && !SLASH.test(c));
          desc = rest.sort((x, y) => y.length - x.length)[0] || "";
        }
      }
      out.push({ type, desc, filer, href, date });
    }
    return out;
  };
  let rows = await page.evaluate(grab);
  for (const frame of page.frames()) {         // documents can render inside an iframe
    try { const fr = await frame.evaluate(grab); rows = rows.concat(fr); } catch {}
  }
  const seen = new Set();
  rows = rows.filter((r) => (seen.has(r.href) ? false : (seen.add(r.href), true)));
  rows.forEach((r) => { r.iso = normDate(r.date); });
  rows.sort((a, b) => (b.iso || "").localeCompare(a.iso || "")); // newest first
  return rows;
}

// Handle both "07/01/2026" and "July 01, 2026" filing-date formats.
function normDate(d) {
  if (!d) return "";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
    const [m, day, y] = d.split("/");
    return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const t = Date.parse(d);
  return isNaN(t) ? "" : new Date(t).toISOString().slice(0, 10);
}

export async function scrapeCPUC(proceedings) {
  const targets = proceedings.filter((p) => p.docket && p.docket.toUpperCase().startsWith("R") && p.url);
  const items = [];
  const diag = { ranAt: new Date().toISOString(), dockets: [] };
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  try {
    const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" });
    const page = await ctx.newPage();
    for (const p of targets) {
      const c = core(p.docket);
      let rows = [];
      const attempts = [];
      for (const url of urls(c)) {
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
          await page.waitForTimeout(3500); // let the APEX report render
          rows = await extract(page);
          const snap = await page.evaluate(() => ({
            title: document.title,
            anchors: document.querySelectorAll("a").length,
            frames: window.frames.length,
            tables: document.querySelectorAll("table").length,
            sampleHrefs: Array.from(document.querySelectorAll("a")).map((a) => a.href).filter(Boolean).slice(0, 20),
            sampleRows: Array.from(document.querySelectorAll("a"))
              .filter((a) => /SearchRes|PublishedDocs|docs\.cpuc/i.test(a.href || ""))
              .slice(0, 5)
              .map((a) => { const tr = a.closest("tr"); return { type: (a.textContent || "").trim(), cells: tr ? Array.from(tr.querySelectorAll("td,th")).map((c) => c.textContent.trim().slice(0, 80)) : [] }; }),
          }));
          attempts.push({ tab: url.includes(":57:") ? "docs" : "card", ...snap, docLinks: rows.length });
          console.log(`CPUC ${p.docket} @ ${url.includes(":57:") ? "docs" : "card"}: ${snap.anchors} anchors, ${snap.frames} frames, ${rows.length} doc-links`);
          if (rows.length) break;
        } catch (e) {
          attempts.push({ tab: url.includes(":57:") ? "docs" : "card", error: e.message });
          console.error(`CPUC ${p.docket}: ${e.message}`);
        }
      }
      diag.dockets.push({ docket: p.docket, docLinks: rows.length, attempts });
      for (const r of rows.slice(0, 8)) {
        const headline = (r.desc && r.desc.length > 4 ? r.desc : r.type) || "Document";
        items.push({
          source: `CPUC ${p.docket}`, agency: "CPUC", docket: p.docket,
          type: guessType(r.type || r.desc), headline, filedBy: r.filer || "", url: r.href, date: r.iso || "",
        });
      }
    }
  } finally { await browser.close(); }
  try { await writeFile(DEBUG_PATH, JSON.stringify(diag, null, 2) + "\n"); } catch {}
  return items;
}

function guessType(t) {
  const s = (t || "").toLowerCase();
  if (s.includes("decision")) return "Decision";
  if (s.includes("ruling")) return "Ruling";
  if (s.includes("comment")) return "Filing/Comments";
  if (s.includes("proposed")) return "Proposed Decision";
  return "Filing";
}
