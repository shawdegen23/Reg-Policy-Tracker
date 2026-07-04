// Lightweight analysis layer. Runs at ingest time, no external API required.
// Classifies each item by adjacent topic, flags quantitative signals, scores
// client relevance, and drafts a starter impact summary for the analyst/Director.

const TOPICS = [
  ["Energy Efficiency", ["energy efficiency", "ee portfolio", "rolling portfolio", "evaluation"]],
  ["Codes & Standards", ["title 24", "title 20", "appliance standard", "building standard", "codes and standards"]],
  ["Building Decarbonization", ["building decarbon", "decarbonization", "electrification", "heat pump", "gas transition", "sb 1221"]],
  ["Demand Flexibility", ["demand flexibility", "demand response", "dynamic rate", "load management", "load shift"]],
  ["Grid Modernization", ["grid moderniz", "distribution planning", "high-der", "distributed energy", "interconnection", "rule 21"]],
  ["Equity", ["equity", "environmental and social justice", "esj", "disadvantaged", "income-qualified", "underserved"]],
  ["Resource Adequacy / Planning", ["resource adequacy", "planning reserve", "integrated resource", "procurement", "capacity"]],
  ["DER / Rates", ["net energy metering", "net billing", "self-generation", "sgip", "der ", "rate design", "tariff"]],
  ["Climate / Air", ["zero-nox", "zero nox", "climate disclosure", "cap-and-trade", "lcfs", "scoping plan", "water heater", "furnace"]],
];

// High-priority signal terms => elevate relevance.
const HIGH_TERMS = ["energy efficiency", "building decarbon", "demand flexibility", "r.25-04-010", "25-04-010"];

// Quantitative signals in a headline (dollars, %, MW/kWh, budgets, deadlines).
const QUANT_RE = /(\$\s?\d)|(\b\d+(\.\d+)?\s?%)|(\b\d+(\.\d+)?\s?(mw|gw|kwh|mwh)\b)|(\bbudget\b)|(\ballocat)|(\bmillion\b)|(\bbillion\b)|(\bdeadline\b)|(\bdue\b)|(\bcomment period\b)/i;

export function analyze(item) {
  const text = `${item.docket || ""} ${item.source || ""} ${item.headline || ""}`.toLowerCase();

  let topic = "General / Cross-cutting";
  for (const [name, kws] of TOPICS) {
    if (kws.some((k) => text.includes(k))) { topic = name; break; }
  }

  const dataType = QUANT_RE.test(item.headline || "") ? "Quantitative" : "Qualitative";

  let relevance = "Medium";
  if (HIGH_TERMS.some((t) => text.includes(t))) relevance = "High";
  else if (topic === "General / Cross-cutting") relevance = "Low";

  const typeLabel = (item.type || "item").toLowerCase();
  const impact = `${topic} ${typeLabel} from ${item.agency || item.source || "source"}. ` +
    `${dataType === "Quantitative" ? "Contains figures/deadlines — capture the numbers. " : ""}` +
    `Flagged ${relevance.toLowerCase()} client relevance; confirm against the docket and add Director-facing framing.`;

  return { ...item, topic, dataType, relevance, impact };
}

// Build a synthesis object for the Director Brief from enriched developments.
export function synthesize(developments, proceedings) {
  const recent = [...developments]
    .sort((a, z) => (z.date || z.firstSeen || "").localeCompare(a.date || a.firstSeen || ""));
  const byTopic = {};
  const byProceeding = {};
  for (const d of recent) {
    const t = d.topic || "General / Cross-cutting";
    (byTopic[t] = byTopic[t] || []).push(d);
    if (d.docket) (byProceeding[d.docket] = byProceeding[d.docket] || []).push(d);
  }
  const high = recent.filter((d) => d.relevance === "High").slice(0, 15);
  const quant = recent.filter((d) => d.dataType === "Quantitative").slice(0, 15);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      developments: developments.length,
      high: recent.filter((d) => d.relevance === "High").length,
      quantitative: recent.filter((d) => d.dataType === "Quantitative").length,
      topics: Object.keys(byTopic).length,
    },
    topicCounts: Object.fromEntries(Object.entries(byTopic).map(([k, v]) => [k, v.length])),
    proceedingCounts: Object.fromEntries(Object.entries(byProceeding).map(([k, v]) => [k, v.length])),
    highRelevance: high,
    quantitative: quant,
  };
}
