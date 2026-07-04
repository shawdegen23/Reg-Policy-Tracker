// Topics this tracker cares about (from the JD). Used to filter noisy source lists.
export const KEYWORDS = [
  "energy efficiency", "building decarbon", "decarbonization", "electrification",
  "heat pump", "demand flexibility", "demand response", "dynamic rate",
  "load management", "grid moderniz", "distributed energy", "der ",
  "resource adequacy", "net energy metering", "net billing", "self-generation",
  "sgip", "integrated resource", "appliance standard", "title 24", "title 20",
  "codes and standards", "building standard", "equity", "environmental and social justice",
  "climate disclosure", "zero-nox", "zero nox", "water heater", "furnace",
];

export function isRelevant(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return KEYWORDS.some((k) => t.includes(k));
}
