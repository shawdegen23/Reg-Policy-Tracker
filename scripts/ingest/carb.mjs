import * as cheerio from "cheerio";

// CARB's rulemaking-activity page is an archive that defaults to old years, so
// follow the current/previous-year facet links to get recent rulemakings.
// CARB runs few rulemakings per year, so we include all recent ones and let the
// analysis layer score relevance (rather than risk filtering out climate
// disclosure / cap-and-trade items whose titles don't contain our keywords).
const BASE = "https://ww2.arb.ca.gov/rulemaking-activity";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" };

async function load(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`CARB HTTP ${res.status}`);
  return cheerio.load(await res.text());
}

export async function scrapeCARB() {
  const now = new Date().getFullYear();
  const wantYears = new Set([String(now), String(now - 1)]);

  const main = await load(BASE);
  const facets = [];
  main("a").each((_, el) => {
    const t = main(el).text().trim();
    if (!wantYears.has(t)) return;
    let h = main(el).attr("href") || "";
    if (h.startsWith("/")) h = "https://ww2.arb.ca.gov" + h;
    else if (h.startsWith("?")) h = BASE + h;
    if (h.startsWith("http")) facets.push([t, h]);
  });

  const items = [];
  const seen = new Set();
  for (const [year, url] of facets) {
    let $;
    try { $ = await load(url); } catch { continue; }
    $("a").each((_, el) => {
      const $el = $(el);
      const title = $el.text().trim();
      let href = $el.attr("href") || "";
      if (!/\/rulemaking\/20\d{2}\//.test(href) || title.length < 8) return;
      if (href.startsWith("/")) href = "https://ww2.arb.ca.gov" + href;
      if (seen.has(href)) return;
      seen.add(href);
      items.push({ source: "CARB", agency: "CARB", docket: "", type: "Rulemaking", headline: title, url: href, date: `${year}-01-01` });
    });
  }
  return items.slice(0, 40);
}
