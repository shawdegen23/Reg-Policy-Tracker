import * as cheerio from "cheerio";
import { isRelevant } from "./keywords.mjs";

// CARB rulemaking activity is server-rendered HTML — fetch + parse.
const PAGE = "https://ww2.arb.ca.gov/rulemaking-activity-2019";

export async function scrapeCARB() {
  const items = [];
  const res = await fetch(PAGE, { headers: { "User-Agent": "reg-policy-tracker" } });
  if (!res.ok) throw new Error(`CARB HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Rulemaking entries appear as links inside the main content region.
  $("main a, .region-content a, article a").each((_, el) => {
    const $el = $(el);
    const title = $el.text().trim();
    let href = $el.attr("href") || "";
    if (!title || title.length < 8) return;
    if (!isRelevant(title)) return;
    if (href.startsWith("/")) href = "https://ww2.arb.ca.gov" + href;
    if (!href.startsWith("http")) return;
    items.push({
      source: "CARB",
      agency: "CARB",
      docket: "",
      type: "Rulemaking",
      headline: title,
      url: href,
      date: "",
    });
  });
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
