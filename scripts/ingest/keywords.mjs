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
