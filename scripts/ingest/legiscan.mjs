import { isRelevant } from "./keywords.mjs";

// LegiScan REST API — free key required (https://legiscan.com/legiscan).
// Set LEGISCAN_API_KEY as a GitHub Actions secret. No key => returns [] gracefully.
const KEY = process.env.LEGISCAN_API_KEY;

export async function scrapeLegiScan() {
  if (!KEY) {
    const err = new Error("LEGISCAN_API_KEY not set");
    err.skipped = true;
    throw err;
  }
  const base = "https://api.legiscan.com/";
  // getMasterList for the current CA session (state=CA returns current session master list).
  const res = await fetch(`${base}?key=${KEY}&op=getMasterList&state=CA`);
  if (!res.ok) throw new Error(`LegiScan HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK" || !data.masterlist) throw new Error("LegiScan bad response");

  const bills = [];
  for (const [k, b] of Object.entries(data.masterlist)) {
    if (k === "session") continue;
    const text = `${b.number} ${b.title}`;
    if (!isRelevant(text)) continue;
    bills.push({
      number: b.number,
      title: b.title,
      lastAction: b.last_action || "",
      lastActionDate: b.last_action_date || "",
      status: String(b.status || ""),
      url: b.url || b.state_link || "",
    });
  }
  return bills.sort((a, z) => (z.lastActionDate || "").localeCompare(a.lastActionDate || "")).slice(0, 60);
}
