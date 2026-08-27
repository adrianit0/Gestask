import { escapeHtml } from "../utils/format.js";

const EMPTY_MESSAGE = "No hay peticiones al servidor en ejecución.";

export function AsyncActivityIndicator(operations = []) {
  const count = operations.length;
  const summary = asyncActivitySummary(operations);

  return `
    <div class="async-activity ${count ? "busy" : "idle"}" tabindex="0" title="${escapeHtml(asyncActivityTitle(operations))}" aria-live="polite" aria-label="${escapeHtml(summary)}">
      <span class="async-activity-dot" aria-hidden="true"></span>
      <span class="async-activity-count">${count}</span>
      <span class="async-activity-label">${escapeHtml(count ? "en curso" : "sin cargas")}</span>
      <div class="async-activity-tooltip" role="tooltip">
        <p class="async-activity-tooltip-title">${escapeHtml(summary)}</p>
        ${count ? `<ul>${operations.map(operationItem).join("")}</ul>` : `<p class="async-activity-tooltip-empty">${EMPTY_MESSAGE}</p>`}
      </div>
    </div>
  `;
}

export function asyncActivitySummary(operations = []) {
  const count = operations.length;
  if (!count) return "Sin cargas en curso";
  return `${count} carga${count === 1 ? "" : "s"} asíncrona${count === 1 ? "" : "s"} en curso`;
}

export function asyncActivityTitle(operations = []) {
  const details = operations.length
    ? operations.map((operation) => `${operation.label}: ${formatElapsed(operation.startedAt)}`).join("\n")
    : EMPTY_MESSAGE;
  return `${asyncActivitySummary(operations)}\n${details}`;
}

export function formatElapsed(startedAt) {
  const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ${String(seconds % 60).padStart(2, "0")} s`;
}

function operationItem(operation) {
  return `<li><span>${escapeHtml(operation.label)}</span><strong>${escapeHtml(formatElapsed(operation.startedAt))}</strong></li>`;
}
