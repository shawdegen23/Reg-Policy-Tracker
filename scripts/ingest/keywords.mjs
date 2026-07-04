// Topics this tracker cares about (from the JD). Used to filter noisy source
// lists (bill master lists, agency news). Word-boundary patterns so short tokens
// like "DER" don't match substrings inside "order", "under", "elder", "provider".
// Case-insensitive.
const RAW = [
  "energy efficiency", "building decarbon", "decarboniz", "electrification",
  "heat pump", "demand flexibility", "demand response", "demand-side",
  "dynamic rate", "time-of-use", "load management", "load shift",
  "grid moderniz", "distributed energy", "\\bDER\\b", "\\bDERs\\b",
  "resource adequacy", "net energy metering", "net billing", "\\bNEM\\b",
  "self-generation", "\\bSGIP\\b", "integrated resource plan", "microgrid",
  "appliance standard", "title 24", "title 20", "codes and standards",
  "building standard", "building energy", "energy code",
  "environmental justice", "disadvantaged communit", "energy equity",
  "climate disclosure", "zero[-\\s]?nox", "water heater", "\\bfurnace",
  "greenhouse gas", "cap[-\\s]and[-\\s]trade", "low carbon fuel",
  "\\bLCFS\\b", "renewable energy", "rooftop solar", "battery storage",
  "energy storage", "ratepayer", "electrical corporation",
  "public utilities commission", "investor-owned util", "\\bIOU\\b",
  "transmission line", "interconnection", "virtual power plant",
  "building electrification", "gas utilit", "clean energy",
];

export const PATTERNS = RAW.map((s) => new RegExp(s, "i"));

export function isRelevant(text) {
  if (!text) return false;
  return PATTERNS.some((re) => re.test(text));
}

// Bucket 1: a deliberately WIDE net for legislation. We'd rather over-include
// here and let the AI relevance gate (bucket 2) make the real call, so we never
// miss an energy bill because its title used unexpected wording.
const WIDE = [
  /energy/i, /electric/i, /utilit/i, /climate/i, /emission/i, /decarboniz/i,
  /\bgrid\b/i, /\bsolar\b/i, /renewable/i, /greenhouse/i, /carbon/i,
  /heat pump/i, /appliance/i, /building standard/i, /building code/i,
  /\bDER\b/, /rooftop/i, /microgrid/i, /ratepayer/i, /electric vehicle/i,
  /\bEV\b/, /charging station/i, /hydrogen/i, /\bstorage\b/i, /wildfire/i,
  /kilowatt/i, /megawatt/i, /power plant/i, /transmission/i, /natural gas/i,
  /clean energy/i, /efficiency/i, /net metering/i, /photovoltaic/i,
];

export function isBillCandidate(text) {
  if (!text) return false;
  return WIDE.some((re) => re.test(text));
}
