// Optional AI enrichment. Provider-agnostic and free-tier friendly:
//   - GEMINI_API_KEY   -> Google Gemini (free tier via AI Studio)  [preferred]
//   - ANTHROPIC_API_KEY -> Anthropic Claude
//   - neither          -> caller keeps the rule-based output
// Any failure degrades gracefully to the rule-based layer.

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PROVIDER = GEMINI_KEY ? "gemini" : ANTHROPIC_KEY ? "anthropic" : null;
const MODEL = process.env.AI_MODEL ||
  (PROVIDER === "gemini" ? "gemini-2.5-flash" : "claude-haiku-4-5-20251001");

export const aiEnabled = () => Boolean(PROVIDER);

async function callGemini(system, user, maxTokens) {
  // New-format Gemini "AQ." auth keys must go in the x-goog-api-key header
  // (the legacy ?key= query param is for the retiring AIza standard keys).
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || "").join("").trim();
}

async function callClaude(system, user, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.content || []).map((b) => b.text || "").join("").trim();
}

async function ask(system, user, maxTokens = 1500) {
  if (PROVIDER === "gemini") return callGemini(system, user, maxTokens);
  if (PROVIDER === "anthropic") return callClaude(system, user, maxTokens);
  throw new Error("no AI provider configured");
}

function parseJson(text) {
  let t = text.trim();
  if (t.startsWith("```")) t = t.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
  const s = t.indexOf("["); const e = t.lastIndexOf("]");
  if (s !== -1 && e !== -1) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

const SYSTEM = `You are a senior California energy regulatory analyst at TEC (The Energy Coalition).
You monitor CPUC, CEC, CARB, AQMD, and the Legislature. Client-relevant topics: energy efficiency,
building decarbonization, demand flexibility, grid modernization, Codes & Standards, and equity.
Be precise, neutral, and concrete. Never invent facts beyond the item text provided.`;

// Overlay AI impact + relevance onto items. Processed in small chunks so the
// model always returns complete, valid JSON (large batches overflow the token
// limit and truncate). A failed chunk falls back to that item's rule-based text.
export async function aiEnrich(items) {
  if (!PROVIDER || items.length === 0) return items;
  const CHUNK = 8;
  const MAX = 64; // cap items enriched per run to bound cost/time
  const enriched = items.map((d) => ({ ...d }));
  for (let start = 0; start < Math.min(items.length, MAX); start += CHUNK) {
    const batch = items.slice(start, start + CHUNK).map((d, j) => ({ i: start + j, headline: d.headline, source: d.source, type: d.type }));
    const user = `For each item, write a plain-English impact summary (max 25 words) explaining why it
matters to TEC's clients, and assign relevance as "High", "Medium", or "Low".
Return ONLY a JSON array like [{"i":0,"impact":"...","relevance":"High"}]. Items:
${JSON.stringify(batch)}`;
    try {
      const arr = parseJson(await ask(SYSTEM, user, 1500));
      for (const r of arr) {
        if (enriched[r.i]) enriched[r.i] = { ...enriched[r.i], impact: r.impact || enriched[r.i].impact, relevance: r.relevance || enriched[r.i].relevance, aiEnriched: true };
      }
    } catch (e) {
      console.error(`aiEnrich chunk ${start}-${start + CHUNK} failed: ${e.message}`);
    }
  }
  return enriched;
}

// Narrative Director briefing from the most notable recent items.
export async function aiBrief(developments) {
  if (!PROVIDER) return null;
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
  return await ask(SYSTEM, user, 800);
}
