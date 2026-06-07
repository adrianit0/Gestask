import { TaskDetailModal } from "../components/TaskTable.js";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { buildDailySchedule, formatScheduleTime } from "../utils/dailySchedule.js";
import { escapeHtml } from "../utils/format.js";

export function DailySchedulePage({ report = null, tasks = [], configurations = [], minutesPerEffortPoint = 60, loading = false, error = "", success = "", detailTask = null } = {}) {
  const schedule = buildDailySchedule(tasks, configurations, minutesPerEffortPoint);

  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Horario diario</p>
        <h1>Horario diario</h1>
      </div>
      <div class="schedule-summary">
        <span>${escapeHtml(schedule.totalEffortPoints)} / ${escapeHtml(schedule.settings.dailyEffortPoints)} PE</span>
        <span>${escapeHtml(formatScheduleTime(schedule.settings.startMinutes))} - ${escapeHtml(formatScheduleTime(schedule.settings.endMinutes))}</span>
      </div>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="panel daily-schedule-panel">
      ${loading ? LoadingState() : report ? DailySchedule(schedule) : EmptyState("No existe parte diario para mostrar el horario.")}
    </section>
    ${detailTask ? TaskDetailModal(detailTask, { readonly: true }) : ""}
  `;
}

function DailySchedule(schedule) {
  if (!schedule.items.length) return EmptyState("No hay tareas con esfuerzo para planificar en el horario diario.");

  return `
    <div class="daily-schedule-list">
      ${schedule.items.map(ScheduleItem).join("")}
    </div>
  `;
}

function ScheduleItem(item) {
  if (item.type === "break" || item.type === "daily") {
    const className = item.type === "break" ? "schedule-break" : "schedule-daily";
    return `
      <article class="schedule-item ${className}">
        <div class="schedule-time">
          <strong>${escapeHtml(formatScheduleTime(item.startMinutes))}</strong>
          <span>${escapeHtml(formatScheduleTime(item.endMinutes))}</span>
        </div>
        <div class="schedule-card">
          <h2>${escapeHtml(item.title)}</h2>
        </div>
      </article>
    `;
  }

  const task = item.task;
  const ticket = task.ticket ? `<a href="https://jira.knowmadmood.com/browse/${encodeURIComponent(task.ticket)}" target="_blank" rel="noreferrer">${escapeHtml(task.ticket)}</a>` : "-";

  return `
    <article class="schedule-item schedule-task" data-schedule-task="${escapeHtml(task.id)}">
      <div class="schedule-time">
        <strong>${escapeHtml(formatScheduleTime(item.startMinutes))}</strong>
        <span>${escapeHtml(formatScheduleTime(item.endMinutes))}</span>
      </div>
      <div class="schedule-card">
        <div class="schedule-card-top">
          <span>${ticket}</span>
          <span>${escapeHtml(task.effort_points)} PE</span>
          <span>Orden ${escapeHtml(task.order_points ?? "-")}</span>
        </div>
        <h2>${escapeHtml(task.title)}</h2>
        ${task.more_info ? `<p>${escapeHtml(task.more_info)}</p>` : ""}
      </div>
    </article>
  `;
}
