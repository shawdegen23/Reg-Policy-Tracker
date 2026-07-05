import proceedings from "../../../data/proceedings.json";
import developments from "../../../data/developments.json";
import bills from "../../../data/bills.json";
import deadlines from "../../../data/deadlines.json";
import { KNOWLEDGE_BASE } from "../../knowledgeBase";

// Server-side chat proxy. The Gemini key stays here (Vercel env var), never the
// browser. Answers are grounded in the live tracker data plus the model's
// knowledge of California government and the CPUC/CEC/CARB regulatory process.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.AI_MODEL || "gemini-2.5-flash";

function buildContext() {
  const procLines = proceedings.filter((p) => p.docket && p.docket !== "CONFIRM #")
    .map((p) => `- ${p.docket} (${p.topic}): ${p.title}`).join("\n");
  const recentDev = [...developments].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 50)
    .map((d) => `- [${d.date}] ${d.agency} ${d.docket || ""} · ${d.type} · ${d.headline}${d.filedBy && d.filedBy !== "-" ? " (filed by " + d.filedBy + ")" : ""}`).join("\n");
  const billLines = bills.slice(0, 90)
    .map((b) => `- ${b.number} [stage ${b.stage}]: ${b.title} — last action: ${b.lastAction} (${b.lastActionDate})`).join("\n");
  const dls = deadlines.length
    ? deadlines.map((d) => `- ${d.date}: ${d.type} for ${d.docket} — ${d.headline}`).join("\n")
    : "(none extracted yet)";
  return `TRACKED CPUC PROCEEDINGS:\n${procLines}\n\nRECENT REGULATORY DEVELOPMENTS (CPUC/CEC/CARB):\n${recentDev}\n\nTRACKED CALIFORNIA ENERGY/CLIMATE BILLS:\n${billLines}\n\nUPCOMING REGULATORY DEADLINES:\n${dls}`;
}

const SYSTEM = `You are the TEC California Regulatory Intelligence assistant — an expert on California state
government and energy & climate regulation, with deep knowledge of the CPUC (California Public Utilities
Commission), CEC (California Energy Commission), CARB (California Air Resources Board), and the California
Legislature, plus how the regulatory process works (rulemakings/proceedings, ALJ rulings, proposed and
final decisions, comment periods, advice letters, the two-year legislative session, committees, etc.).

You help the user learn about and reason through California regulatory and governance questions. You draw on:
1. The CALIFORNIA REGULATORY KNOWLEDGE BASE below — curated, authoritative reference on CA governance
   structure, the CPUC/CEC/CARB, and the legislative process. Treat it as your primary reference for how
   things work and prefer it over vague recollection.
2. LIVE TRACKER DATA (below) — the current proceedings, filings, bills, and deadlines this organization
   is actively monitoring.
3. Your broader expertise, to fill gaps and add context.

Rules:
- When a question relates to the tracked data, ground your answer in it and cite specifics: dockets
  (e.g., R.25-04-010), bill numbers (e.g., AB 1787), dates, and parties/filers.
- For general California-governance or process questions, teach clearly and accurately.
- NEVER fabricate docket numbers, bill numbers, dates, filings, or outcomes. If you don't know or the
  data doesn't cover it, say so and suggest where to verify (e.g., the CPUC docket card or leginfo).
- Be concise but substantive; explain jargon in plain language.`;

export async function POST(req) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "The assistant isn't configured yet — add GEMINI_API_KEY to the Vercel project's Environment Variables and redeploy." });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request." }, { status: 400 }); }
  const msgs = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  if (!msgs.length) return Response.json({ error: "No message." }, { status: 400 });

  const contents = msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content || "").slice(0, 4000) }] }));
  const system = SYSTEM
    + "\n\n=== CALIFORNIA REGULATORY KNOWLEDGE BASE (curated reference) ===\n" + KNOWLEDGE_BASE
    + "\n\n=== LIVE TRACKER DATA (as of the latest ingest) ===\n" + buildContext();

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: 0.4, maxOutputTokens: 1400 } }),
    });
    if (!res.ok) {
      const t = await res.text();
      const msg = res.status === 429 ? "Rate limit reached — wait a minute and try again (free tier allows ~10 questions/minute)." : `AI error (${res.status}).`;
      return Response.json({ error: msg, detail: t.slice(0, 150) });
    }
    const data = await res.json();
    const answer = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    return Response.json({ answer: answer || "(The model returned an empty response — try rephrasing.)" });
  } catch (e) {
    return Response.json({ error: "Request failed: " + e.message });
  }
}
