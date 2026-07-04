// Optional AI enrichment via the Anthropic API. Activates only when
// ANTHROPIC_API_KEY is set (GitHub secret). Everything degrades gracefully:
// if the key is missing or a call fails, the caller keeps the rule-based output.

const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.AI_MODEL || "claude-haiku-4-5-20251001";
const API = "https://api.anthropic.com/v1/messages";

export const aiEnabled = () => Boolean(KEY);

async function callClaude(system, user, maxTokens = 1500) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "x-api-key": KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.content || []).map((b) => b.text || "").join("").trim();
}

function parseJson(text) {
  let t = text.trim();
  if (t.startsWith("```")) t = t.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(t);
}

const SYSTEM = `You are a senior California energy regulatory analyst at TEC (The Energy Coalition).
You monitor CPUC, CEC, CARB, AQMD, and the Legislature. Client-relevant topics: energy efficiency,
building decarbonization, demand flexibility, grid modernization, Codes & Standards, and equity.
Be precise, neutral, and concrete. Never invent facts beyond the item text provided.`;

// Overlay AI impact + relevance onto items (in place order preserved).
export async function aiEnrich(items) {
  if (!KEY || items.length === 0) return items;
  const slim = items.slice(0, 40).map((d, i) => ({ i, headline: d.headline, source: d.source, type: d.type }));
  const user = `For each item, write a plain-English impact summary (max 25 words) explaining why it
matters to TEC's clients, and assign relevance as "High", "Medium", or "Low".
Return ONLY a JSON array like [{"i":0,"impact":"...","relevance":"High"}]. Items:
${JSON.stringify(slim)}`;
  const out = await callClaude(SYSTEM, user, 2000);
  const arr = parseJson(out);
  const byIndex = new Map(arr.map((r) => [r.i, r]));
  return items.map((d, idx) => {
    const r = byIndex.get(idx);
    if (!r) return d;
    return { ...d, impact: r.impact || d.impact, relevance: r.relevance || d.relevance, aiEnriched: true };
  });
}

// Narrative Director briefing from the most notable recent items.
export async function aiBrief(developments) {
  if (!KEY) return null;
  const top = developments
    .filter((d) => d.relevance === "High" || d.dataType === "Quantitative")
    .slice(0, 25)
    .map((d) => ({ date: d.date, source: d.source, topic: d.topic, headline: d.headline }));
  if (top.length === 0) return null;
  const user = `Write a concise Director briefing (max 150 words) synthesizing the most important
recent California regulatory developments below. Lead with anything on the Energy Efficiency
proceeding (R.25-04-010). Group by theme, note deadlines or dollar figures, and flag what needs
client attention. Plain prose, no bullet headers. Items:
${JSON.stringify(top)}`;
  return await callClaude(SYSTEM, user, 800);
}
