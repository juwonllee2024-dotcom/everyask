export function collectConversationFromDocument(provider = "auto") {
  if (typeof document === "undefined") {
    return { ok: false, reason: "No browser document is available." };
  }

  const selectors = {
    chatgpt: {
      user: ['[data-message-author-role="user"]'],
      assistant: ['[data-message-author-role="assistant"]']
    },
    claude: {
      user: ['[data-testid="user-message"]', '[data-message-author-role="user"]'],
      assistant: ['[data-testid="assistant-message"]', '[data-message-author-role="assistant"]']
    },
    generic: {
      user: ['[data-message-author-role="user"]', '[data-testid="user-message"]'],
      assistant: ['[data-message-author-role="assistant"]', '[data-testid="assistant-message"]']
    }
  };
  const chosen = provider === "chatgpt" || provider === "claude" || provider === "generic" ? provider : "generic";

  const clip = (text, max = 12000) => {
    const clean = String(text ?? "")
      .replace(/\r\n?/gu, "\n")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/gu, " ").trim())
      .filter(Boolean)
      .join("\n");
    return clean.length > max ? clean.slice(-max) : clean;
  };

  const latestText = (selectorList) => {
    const nodes = [];
    const seen = new Set();
    for (const selector of selectorList) {
      for (const node of document.querySelectorAll(selector)) {
        if (!seen.has(node)) {
          seen.add(node);
          nodes.push(node);
        }
      }
    }
    const node = nodes.at(-1);
    return clip(node?.innerText ?? node?.textContent ?? "");
  };

  const request = latestText(selectors[chosen].user);
  const answer = latestText(selectors[chosen].assistant);
  if (!request || !answer) {
    return {
      ok: false,
      reason: "No recognizable user and assistant messages found on this tab."
    };
  }

  return { ok: true, provider: chosen, request, answer };
}
