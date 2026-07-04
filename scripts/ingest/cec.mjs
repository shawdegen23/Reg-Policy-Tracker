import * as cheerio from "cheerio";
import { isRelevant } from "./keywords.mjs";

// CEC news releases are server-rendered — fetch + parse, filter to relevant topics.
const PAGES = [
  "https://www.energy.ca.gov/newsroom/news-releases",
  "https://www.energy.ca.gov/proceedings",
];

export async function scrapeCEC() {
  const items = [];
  for (const page of PAGES) {
    try {
      const res = await fetch(page, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-US,en;q=0.9" } });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      $("main a, article a, .view-content a, .region-content a").each((_, el) => {
        const $el = $(el);
        const title = $el.text().trim();
        let href = $el.attr("href") || "";
        if (!title || title.length < 12) return;
        if (!isRelevant(title)) return;
        if (href.startsWith("/")) href = "https://www.energy.ca.gov" + href;
        if (!href.startsWith("http")) return;
        items.push({
          source: "CEC",
          agency: "CEC",
          docket: "",
          type: "Notice",
          headline: title,
          url: href,
          date: "",
        });
      });
    } catch (e) {
      // continue to next page
    }
  }
  return dedupe(items).slice(0, 40);
}

function dedupe(arr) {
  const seen = new Set();
  return arr.filter((x) => {
    const k = x.url || x.headline;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
