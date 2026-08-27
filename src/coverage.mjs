const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from",
  "how", "i", "in", "into", "is", "it", "my", "of", "on", "or", "please", "should", "that",
  "the", "this", "to", "we", "what", "who", "why", "will", "with", "you", "your"
]);

const UNCERTAINTY = /\b(?:maybe|probably|perhaps|might|could|uncertain|not sure|i think)\b/iu;
const NEGATION = /\b(?:no|never|didn['’]?t|did not|hasn['’]?t|has not|haven['’]?t|have not|unable|cannot|can['’]?t|missing|todo|to do)\b/iu;

const IRREGULAR_STEMS = new Map([
  ["written", "write"],
  ["wrote", "write"],
  ["added", "add"],
  ["ran", "run"]
]);

function stem(token) {
  if (IRREGULAR_STEMS.has(token)) return IRREGULAR_STEMS.get(token);
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokens(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu)?.map(stem) ?? [];
}

function keywords(text) {
  const words = tokens(text).filter((word) => !STOP_WORDS.has(word));
  return [...new Set(words.length > 0 ? words : tokens(text))];
}

function sentences(text) {
  return String(text ?? "")
    .split(/\n+|(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function clip(text, max = 180) {
  const clean = String(text ?? "").replace(/\s+/gu, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function inspectRequirement(requirement, answer) {
  const wanted = keywords(requirement.text);
  if (wanted.length === 0) {
    return { ...requirement, status: "unclear", ratio: 0, matchedKeywords: [], evidence: "" };
  }

  let best = { ratio: 0, matchedKeywords: [], evidence: "", uncertain: false, negated: false };
  for (const sentence of sentences(answer)) {
    const available = new Set(tokens(sentence));
    const matched = wanted.filter((word) => available.has(word));
    const ratio = matched.length / wanted.length;
    if (ratio >= best.ratio) {
      best = {
        ratio,
        matchedKeywords: matched,
        evidence: ratio >= 0.34 ? clip(sentence) : "",
        uncertain: UNCERTAINTY.test(sentence),
        negated: NEGATION.test(sentence)
      };
    }
  }

  let status = "missing";
  if (best.ratio >= 0.67) status = "complete";
  else if (best.ratio >= 0.34) status = "partial";
  if (best.negated && best.ratio >= 0.34) status = "missing";
  else if (best.uncertain && best.ratio >= 0.34) status = "unclear";

  return {
    ...requirement,
    status,
    ratio: Number(best.ratio.toFixed(2)),
    matchedKeywords: best.matchedKeywords,
    evidence: best.evidence
  };
}

export function checkCoverage(requirements, answer) {
  const safeRequirements = Array.isArray(requirements) ? requirements : [];
  const items = safeRequirements.map((requirement) => inspectRequirement(requirement, answer));
  const summary = {
    total: items.length,
    complete: items.filter((item) => item.status === "complete").length,
    partial: items.filter((item) => item.status === "partial").length,
    missing: items.filter((item) => item.status === "missing").length,
    unclear: items.filter((item) => item.status === "unclear").length,
    needsFollowUp: items.filter((item) => item.status !== "complete").length
  };

  let overallStatus = "unclear";
  if (summary.total > 0 && summary.needsFollowUp === 0) overallStatus = "complete";
  else if (summary.total > 0 && summary.complete === 0 && summary.partial === 0 && summary.unclear === 0) overallStatus = "missing";
  else if (summary.total > 0) overallStatus = "partial";

  return { items, summary, overallStatus };
}

export function buildFollowUp(result) {
  const incomplete = (result?.items ?? []).filter((item) => item.status !== "complete");
  if (incomplete.length === 0) return "";
  return [
    "Please answer these incomplete items only:",
    ...incomplete.map((item, index) => `${index + 1}. ${item.text}`)
  ].join("\n");
}
