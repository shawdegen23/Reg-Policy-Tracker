import { chromium } from "playwright";

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
      const text = (a.textContent || "").trim();
      if (!/PublishedDocs|\.PDF|efile|Efile|SearchRes|docs\.cpuc\.ca\.gov/i.test(href)) continue;
      if (!text || text.length < 5) continue;
      let date = "";
      const tr = a.closest("tr");
      if (tr) { const m = tr.textContent.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/); if (m) date = m[1]; }
      out.push({ text, href, date });
    }
    return out;
  };
  let rows = await page.evaluate(grab);
  for (const frame of page.frames()) {         // documents can render inside an iframe
    try { const fr = await frame.evaluate(grab); rows = rows.concat(fr); } catch {}
  }
  // de-dupe by href
  const seen = new Set();
  return rows.filter((r) => (seen.has(r.href) ? false : (seen.add(r.href), true)));
}

export async function scrapeCPUC(proceedings) {
  const targets = proceedings.filter((p) => p.docket && p.docket.toUpperCase().startsWith("R") && p.url);
  const items = [];
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  try {
    const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" });
    const page = await ctx.newPage();
    for (const p of targets) {
      const c = core(p.docket);
      let rows = [];
      for (const url of urls(c)) {
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
          await page.waitForTimeout(3500); // let the APEX report render
          rows = await extract(page);
          const anchors = await page.evaluate(() => document.querySelectorAll("a").length);
          console.log(`CPUC ${p.docket} @ ${url.includes(":57:") ? "docs" : "card"}: ${anchors} anchors, ${rows.length} doc-links`);
          if (rows.length) break;
        } catch (e) {
          console.error(`CPUC ${p.docket}: ${e.message}`);
        }
      }
      for (const r of rows.slice(0, 8)) {
        items.push({
          source: `CPUC ${p.docket}`, agency: "CPUC", docket: p.docket,
          type: guessType(r.text), headline: r.text, url: r.href, date: normDate(r.date),
        });
      }
    }
  } finally { await browser.close(); }
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
