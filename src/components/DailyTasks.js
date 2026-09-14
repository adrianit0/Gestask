import { escapeHtml, todayIso } from "../utils/format.js";
import { ticketLinkHtml } from "../utils/projectSettings.js";

const INDICATOR_LABELS = {
  ok: "diarias al día",
  warning: "diarias de hoy",
  error: "diarias atrasadas",
};

// Pending items from today are a warning; any pending item from a previous day is an error.
export function getDailyPendingSummary(pending = {}) {
  const today = pending.today || todayIso();
  const items = Array.isArray(pending.items) ? pending.items : [];
  const overdue = items.filter((item) => item.report_date < today);
  const todayItems = items.filter((item) => item.report_date >= today);
  const status = overdue.length ? "error" : todayItems.length ? "warning" : "ok";
  return { today, overdue, todayItems, status, count: items.length };
}

export function DailyPendingIndicator(pending) {
  const summary = getDailyPendingSummary(pending);
  const text = dailyPendingText(summary);

  return `
    <div class="daily-pending daily-pending-${summary.status}">
      <button type="button" class="daily-pending-pill" data-page="dailyRoutine" aria-label="${escapeHtml(text)}">
        <span class="daily-pending-dot" aria-hidden="true"></span>
        <span class="daily-pending-count">${summary.count}</span>
        <span class="daily-pending-label">${INDICATOR_LABELS[summary.status]}</span>
      </button>
      <div class="daily-pending-tooltip" role="tooltip">
        <p class="daily-pending-tooltip-title">${escapeHtml(text)}</p>
        ${summary.count
          ? `${pendingTooltipSection("Días anteriores", summary.overdue, true)}${pendingTooltipSection("Hoy", summary.todayItems, false)}`
          : `<p class="daily-pending-tooltip-empty">No quedan tareas diarias por realizar.</p>`}
      </div>
    </div>
  `;
}

export function DailyTaskChecklist(tasks = [], reportDate, completionPendingKeys = new Set()) {
  if (!tasks.length) return "";
  const done = tasks.filter((task) => task.completed_at).length;

  return `
    <section class="panel daily-checklist-panel">
      <header class="daily-checklist-header">
        <h2>Tareas diarias</h2>
        <span class="daily-checklist-progress ${done === tasks.length ? "complete" : ""}">${done} / ${tasks.length} realizadas</span>
      </header>
      <ul class="daily-checklist">
        ${tasks.map((task) => DailyTaskChecklistItem(task, reportDate, completionPendingKeys)).join("")}
      </ul>
    </section>
  `;
}

export function DailyTaskChecklistItem(task, reportDate, completionPendingKeys = new Set()) {
  const done = Boolean(task.completed_at);
  const saving = completionPendingKeys.has(dailyCompletionKey(task.id, reportDate));

  return `
    <li class="daily-checklist-item ${done ? "done" : ""} ${saving ? "saving" : ""}">
      <label>
        <input type="checkbox" data-daily-task-check="${escapeHtml(task.id)}" data-report-date="${escapeHtml(reportDate)}" ${done ? "checked" : ""} ${saving ? "disabled" : ""} />
        <span class="daily-checklist-text">
          <span class="daily-checklist-title">${escapeHtml(task.title)}</span>
          ${task.more_info ? `<small>${escapeHtml(task.more_info)}</small>` : ""}
        </span>
      </label>
      ${task.ticket ? `<span class="daily-checklist-ticket">${ticketLinkHtml(task.ticket)}</span>` : ""}
    </li>
  `;
}

export function dailyCompletionKey(taskId, reportDate) {
  return `${taskId}|${reportDate}`;
}

export function formatDailyReportDate(value) {
  const date = parseIsoDate(value);
  if (!date) return String(value ?? "");
  return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function dailyPendingText({ overdue, todayItems }) {
  if (overdue.length) return `${pluralDailyTasks(overdue.length)} de días anteriores sin realizar: deben realizarse`;
  if (todayItems.length) return `${pluralDailyTasks(todayItems.length)} de hoy por realizar`;
  return "Tareas diarias al día";
}

function pluralDailyTasks(count) {
  return `${count} tarea${count === 1 ? "" : "s"} diaria${count === 1 ? "" : "s"}`;
}

function pendingTooltipSection(title, items, showDate) {
  if (!items.length) return "";
  return `
    <p class="daily-pending-tooltip-section">${escapeHtml(title)}</p>
    <ul>
      ${items.map((item) => `
        <li>
          <span>${escapeHtml(item.ticket ? `${item.ticket} · ${item.title}` : item.title)}</span>
          ${showDate ? `<strong>${escapeHtml(formatShortDate(item.report_date))}</strong>` : ""}
        </li>
      `).join("")}
    </ul>
  `;
}

function formatShortDate(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}` : String(value ?? "");
}

function parseIsoDate(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
