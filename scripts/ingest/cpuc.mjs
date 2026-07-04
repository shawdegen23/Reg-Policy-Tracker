import { chromium } from "playwright";

// The CPUC docket system (apps.cpuc.ca.gov) is JavaScript-rendered, so a plain
// fetch returns nothing. Playwright loads it in a real browser and reads the
// rendered "Documents" list for each tracked proceeding.
//
// NOTE: APEX markup is complex; selectors are best-effort and may need tuning
// after the first live run. Failures are non-fatal — other sources still ingest.

const DOCS_URL = (core) =>
  `https://apps.cpuc.ca.gov/apex/f?p=401:57:0::NO:RP,57,RIR:P5_PROCEEDING_SELECT:${core}`;

function coreOf(docket) {
  return docket.replace(/[.\-]/g, "").trim(); // R.25-04-010 -> R2504010
}

export async function scrapeCPUC(proceedings) {
  const targets = proceedings.filter(
    (p) => p.docket && p.docket.toUpperCase().startsWith("R") && p.url
  );
  const items = [];
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  try {
    const ctx = await browser.newContext({ userAgent: "reg-policy-tracker" });
    const page = await ctx.newPage();
    for (const p of targets) {
      const core = coreOf(p.docket);
      try {
        await page.goto(DOCS_URL(core), { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(1500);
        const rows = await page.evaluate(() => {
          const out = [];
          const anchors = Array.from(document.querySelectorAll("a"));
          for (const a of anchors) {
            const href = a.href || "";
            const text = (a.textContent || "").trim();
            if (!/PublishedDocs|\.PDF|efile|Efile/i.test(href)) continue;
            if (!text || text.length < 6) continue;
            // try to find a date in the same table row
            let date = "";
            const tr = a.closest("tr");
            if (tr) {
              const m = tr.textContent.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
              if (m) date = m[1];
            }
            out.push({ text, href, date });
          }
          return out.slice(0, 8);
        });
        for (const r of rows) {
          items.push({
            source: `CPUC ${p.docket}`,
            agency: "CPUC",
            docket: p.docket,
            type: guessType(r.text),
            headline: r.text,
            url: r.href,
            date: normDate(r.date),
          });
        }
      } catch (e) {
        // skip this docket, continue
        console.error(`CPUC ${p.docket}: ${e.message}`);
      }
    }
  } finally {
    await browser.close();
  }
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
