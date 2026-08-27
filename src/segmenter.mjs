const MAX_ITEMS = 12;

const LIST_PATTERNS = [
  { kind: "checkbox", pattern: /^\s*(?:[-*]\s*)?\[\s*[xX]?\s*\]\s+(.+?)\s*$/u },
  { kind: "numbered", pattern: /^\s*\d+[.)]\s+(.+?)\s*$/u },
  { kind: "bullet", pattern: /^\s*[-*•]\s+(.+?)\s*$/u }
];

function cleanLine(line) {
  return line.replace(/\s+/gu, " ").trim();
}

function cleanInput(input) {
  return String(input ?? "")
    .replace(/```[\s\S]*?```/gu, " ")
    .replace(/\r\n?/gu, "\n")
    .trim();
}

function makeItem(text, kind, index) {
  return { id: `r${index}`, text: cleanLine(text), kind };
}

export function parseRequirements(input, { maxItems = MAX_ITEMS } = {}) {
  const source = cleanInput(input);
  const safeMax = Number.isInteger(maxItems) && maxItems > 0 ? maxItems : MAX_ITEMS;
  if (!source) {
    return { source, requirements: [], truncated: false, mode: "none" };
  }

  const lines = source.split("\n").map(cleanLine).filter(Boolean);
  const explicit = [];
  for (const line of lines) {
    for (const { kind, pattern } of LIST_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        explicit.push({ text: match[1], kind });
        break;
      }
    }
  }

  if (explicit.length > 0) {
    return {
      source,
      requirements: explicit.slice(0, safeMax).map((item, index) => makeItem(item.text, item.kind, index + 1)),
      truncated: explicit.length > safeMax,
      mode: "explicit"
    };
  }

  const questions = lines.filter((line) => /\?\s*$/u.test(line));
  if (questions.length > 1) {
    return {
      source,
      requirements: questions.slice(0, safeMax).map((line, index) => makeItem(line, "question", index + 1)),
      truncated: questions.length > safeMax,
      mode: "questions"
    };
  }

  return {
    source,
    requirements: [makeItem(lines.join(" "), "implicit", 1)],
    truncated: false,
    mode: "implicit"
  };
}
