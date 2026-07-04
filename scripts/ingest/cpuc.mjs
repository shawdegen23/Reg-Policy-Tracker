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
  const grab = () => {
    const out = [];
    for (const a of Array.from(document.querySelectorAll("a"))) {
      const href = a.href || "";
      const type = (a.textContent || "").trim(); // e.g. "COMMENTS", "RULING"
      if (!/PublishedDocs|\.PDF|efile|Efile|SearchRes|docs\.cpuc\.ca\.gov/i.test(href)) continue;
      const tr = a.closest("tr");
      let date = "", desc = "";
      if (tr) {
        const cells = Array.from(tr.querySelectorAll("td,th")).map((c) => c.textContent.trim());
        for (const c of cells) { const m = c.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/); if (m) { date = m[1]; break; } }
        // description = the longest cell that isn't the date or the type label
        const cand = cells.filter((c) => c && c !== type && !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(c));
        desc = cand.sort((x, y) => y.length - x.length)[0] || "";
      }
      out.push({ type, desc, href, date });
    }
    return out;
  };
  let rows = await page.evaluate(grab);
  for (const frame of page.frames()) {         // documents can render inside an iframe
    try { const fr = await frame.evaluate(grab); rows = rows.concat(fr); } catch {}
  }
  const seen = new Set();
  rows = rows.filter((r) => (seen.has(r.href) ? false : (seen.add(r.href), true)));
  // newest first when dates are available
  rows.sort((a, b) => (parseDate(b.date) - parseDate(a.date)));
  return rows;
}

function parseDate(d) {
  if (!d) return 0;
  const [m, day, y] = d.split("/");
  return y ? new Date(`${y}-${m}-${day}`).getTime() : 0;
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
          type: guessType(r.type || r.desc), headline, url: r.href, date: normDate(r.date),
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
function normDate(d) {
  if (!d) return "";
  const [m, day, y] = d.split("/");
  if (!y) return "";
  return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
