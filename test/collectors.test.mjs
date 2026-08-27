import test from "node:test";
import assert from "node:assert/strict";
import { collectConversationFromDocument } from "../src/collectors.mjs";

function fakeDocument(selectorMap) {
  return {
    querySelectorAll(selector) {
      return selectorMap[selector] ?? [];
    }
  };
}

test("collects only the latest recognized user and assistant blocks", () => {
  const previousDocument = globalThis.document;
  globalThis.document = fakeDocument({
    '[data-message-author-role="user"]': [{ innerText: "Old request" }, { innerText: "1. Write docs\n2. Add tests" }],
    '[data-message-author-role="assistant"]': [{ innerText: "Old answer" }, { innerText: "Docs written. Tests added." }]
  });

  try {
    assert.deepEqual(collectConversationFromDocument("chatgpt"), {
      ok: true,
      provider: "chatgpt",
      request: "1. Write docs\n2. Add tests",
      answer: "Docs written. Tests added."
    });
  } finally {
    globalThis.document = previousDocument;
  }
}
);

test("returns a safe unsupported result when no AI conversation is recognizable", () => {
  const previousDocument = globalThis.document;
  globalThis.document = fakeDocument({});

  try {
    const result = collectConversationFromDocument("auto");
    assert.equal(result.ok, false);
    assert.match(result.reason, /recognizable/i);
    assert.equal("request" in result, false);
    assert.equal("answer" in result, false);
  } finally {
    globalThis.document = previousDocument;
  }
}
);

test("keeps the collector self-contained for chrome.scripting injection", () => {
  const previousDocument = globalThis.document;
  globalThis.document = fakeDocument({
    '[data-message-author-role="user"]': [{ textContent: "1. Ship it" }],
    '[data-message-author-role="assistant"]': [{ textContent: "It is shipped." }]
  });

  try {
    const injected = eval(`(${collectConversationFromDocument.toString()})`);
    assert.deepEqual(injected("chatgpt"), {
      ok: true,
      provider: "chatgpt",
      request: "1. Ship it",
      answer: "It is shipped."
    });
  } finally {
    globalThis.document = previousDocument;
  }
}
);
