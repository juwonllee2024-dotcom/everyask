import { collectConversationFromDocument } from "./src/collectors.mjs";
import { buildFollowUp, checkCoverage } from "./src/coverage.mjs";
import { parseRequirements } from "./src/segmenter.mjs";

const provider = document.querySelector("#provider");
const checkButton = document.querySelector("#check-button");
const statusLine = document.querySelector("#status");
const emptyState = document.querySelector("#empty-state");
const resultPanel = document.querySelector("#result-panel");
const answerCount = document.querySelector("#answer-count");
const summaryTitle = document.querySelector("#summary-title");
const summaryText = document.querySelector("#summary-text");
const requestPreview = document.querySelector("#request-preview");
const answerPreview = document.querySelector("#answer-preview");
const results = document.querySelector("#results");
const followUp = document.querySelector("#follow-up");
const copyButton = document.querySelector("#copy-button");
const copyStatus = document.querySelector("#copy-status");
let latestFollowUp = "";

const labels = { complete: "ANSWERED", partial: "PARTIAL", missing: "MISSING", unclear: "UNCLEAR" };

function setStatus(message, kind = "") {
  statusLine.textContent = message;
  statusLine.className = `status-line ${kind}`.trim();
}

function addText(parent, className, text) {
  const element = document.createElement("p");
  element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderCoverage(collected, parsed, coverage) {
  const { summary } = coverage;
  emptyState.hidden = true;
  resultPanel.hidden = false;
  answerCount.textContent = `${summary.complete}/${summary.total}`;
  summaryTitle.textContent = summary.needsFollowUp === 0 ? "Everything accounted for" : `${summary.complete} of ${summary.total} asks fully evidenced`;
  summaryText.textContent = summary.needsFollowUp === 0
    ? "This check found direct structural evidence for every extracted ask."
    : `${summary.partial} partial · ${summary.missing} missing · ${summary.unclear} unclear. Review before you move on.`;
  requestPreview.textContent = parsed.source;
  answerPreview.textContent = collected.answer;
  results.replaceChildren();

  for (const item of coverage.items) {
    const card = document.createElement("article");
    card.className = `result-card ${item.status}`;
    const top = document.createElement("div");
    top.className = "result-top";
    addText(top, "requirement", item.text);
    const badge = document.createElement("span");
    badge.className = "status-badge";
    badge.textContent = labels[item.status] ?? "UNCLEAR";
    top.append(badge);
    card.append(top);
    if (item.evidence) {
      const evidence = document.createElement("p");
      evidence.className = "evidence";
      const label = document.createElement("strong");
      label.textContent = "EVIDENCE  ";
      evidence.append(label, document.createTextNode(item.evidence));
      card.append(evidence);
    } else {
      addText(card, "evidence", "No matching evidence found in the latest answer.");
    }
    results.append(card);
  }

  latestFollowUp = buildFollowUp(coverage);
  followUp.hidden = latestFollowUp.length === 0;
  copyStatus.textContent = "";
  setStatus(`Checked ${summary.total} extracted ask${summary.total === 1 ? "" : "s"} from the current tab.`, summary.needsFollowUp === 0 ? "success" : "");
}

async function checkCurrentTab() {
  checkButton.disabled = true;
  setStatus("Reading the latest visible request and answer…");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active browser tab found.");
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectConversationFromDocument,
      args: [provider.value]
    });
    const collected = injection?.result;
    if (!collected?.ok) throw new Error(collected?.reason ?? "No recognizable conversation found on this tab.");
    const parsed = parseRequirements(collected.request);
    if (parsed.requirements.length === 0) throw new Error("No request items could be extracted. Try a numbered or bulleted request.");
    renderCoverage(collected, parsed, checkCoverage(parsed.requirements, collected.answer));
  } catch (error) {
    resultPanel.hidden = true;
    emptyState.hidden = false;
    setStatus(error instanceof Error ? error.message : "EveryAsk could not inspect this tab.", "error");
  } finally {
    checkButton.disabled = false;
  }
}

async function copyFollowUp() {
  if (!latestFollowUp) return;
  try {
    await navigator.clipboard.writeText(latestFollowUp);
    copyStatus.textContent = "Copied. Paste it into the AI chat when ready.";
  } catch {
    copyStatus.textContent = "Copy blocked by the browser. Select the missing items manually.";
  }
}

checkButton.addEventListener("click", checkCurrentTab);
copyButton.addEventListener("click", copyFollowUp);
