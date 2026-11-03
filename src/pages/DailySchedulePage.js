import { DailyTaskChecklist, formatDailyReportDate } from "../components/DailyTasks.js";
import { PageHeader } from "../components/PageHeader.js";
import { BacklogTaskButton, TaskDetailModal, TaskModal, taskColorVars } from "../components/TaskTable.js";
import { EmptyState, LoadingState } from "../components/StateMessages.js";
import { buildDailySchedule, formatScheduleTime } from "../utils/dailySchedule.js";
import { escapeHtml } from "../utils/format.js";
import { ticketLinkHtml } from "../utils/projectSettings.js";

export function DailySchedulePage({ report = null, date = null, tasks = [], routineTasks = [], dailyCompletionPending = new Set(), configurations = [], minutesPerEffortPoint = 60, includeExtraHours = false, loading = false, modalTask = undefined, detailTask = null } = {}) {
  const schedule = buildDailySchedule(tasks, configurations, minutesPerEffortPoint, date, { includeExtraHours });
  const timeOffset = schedule.settings.scheduleTimeOffsetMinutes;

  return `
    ${PageHeader({
      eyebrow: "Día a día",
      title: "Horario diario",
      description: report ? `Planificación del ${formatDailyReportDate(report.report_date)} según los puntos de esfuerzo.` : "Planificación del parte diario según los puntos de esfuerzo.",
      actions: `
        <div class="schedule-summary">
          ${schedule.settings.intensive ? `<span class="summary-pill">Horario intensivo</span>` : ""}
          <span class="summary-pill" title="Puntos de esfuerzo planificados / objetivo diario">${escapeHtml(schedule.totalEffortPoints)} / ${escapeHtml(schedule.settings.dailyEffortPoints)} PE</span>
          <span class="summary-pill">${escapeHtml(formatScheduleTime(schedule.settings.startMinutes, timeOffset))} – ${escapeHtml(formatScheduleTime(schedule.settings.endMinutes, timeOffset))}</span>
        </div>
      `,
    })}
    ${report && !loading ? DailyTaskChecklist(routineTasks, report.report_date, dailyCompletionPending) : ""}
    <section class="panel daily-schedule-panel">
      ${loading ? LoadingState() : report ? DailySchedule(schedule, includeExtraHours) : EmptyState("No existe parte diario para mostrar el horario.")}
    </section>
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
    ${detailTask ? TaskDetailModal(detailTask, { readonly: false }) : ""}
  `;
}

function DailySchedule(schedule, includeExtraHours = false) {
  const list = schedule.items.length
    ? `
    <div class="daily-schedule-list">
      ${schedule.items.map((item) => ScheduleItem(item, schedule.settings.scheduleTimeOffsetMinutes)).join("")}
    </div>
  `
    : EmptyState("No hay tareas con esfuerzo para planificar en el horario diario.");

  return `
    ${list}
    ${ExtraHoursToggle(includeExtraHours)}
  `;
}

function ExtraHoursToggle(includeExtraHours = false) {
  const label = includeExtraHours ? "Mostrar menos horas" : "Incluir horas";
  return `
    <button type="button" class="schedule-include-toggle" data-toggle-extra-hours aria-pressed="${includeExtraHours}">
      <svg aria-hidden="true" viewBox="0 0 24 24">${includeExtraHours ? `<path d="M5 12h14"></path>` : `<path d="M12 5v14"></path><path d="M5 12h14"></path>`}</svg>
      ${escapeHtml(label)}
    </button>
  `;
}

function ScheduleItem(item, timeOffset = 0) {
  if (item.type === "break" || item.type === "daily") {
    const className = item.type === "break" ? "schedule-break" : "schedule-daily";
    return `
      <article class="schedule-item ${className}">
        ${ScheduleTime(item, timeOffset)}
        <div class="schedule-card">
          <h2>${escapeHtml(item.title)}</h2>
        </div>
      </article>
    `;
  }

  const task = item.task;
  return `
    <article class="schedule-item schedule-task clickable-row" data-schedule-task="${escapeHtml(task.id)}" tabindex="0" style="${taskColorVars(task)}">
      ${ScheduleTime(item, timeOffset)}
      <div class="schedule-card">
        <div class="schedule-card-top">
          ${task.ticket ? `<span class="task-ticket">${ticketLinkHtml(task.ticket)}</span>` : ""}
          <span class="schedule-tag">${escapeHtml(task.effort_points)} PE</span>
          ${item.partial ? `<span class="schedule-tag schedule-partial-tag">Tarea parcial</span>` : ""}
          <span class="schedule-tag">Orden ${escapeHtml(task.order_points ?? "-")}</span>
          ${BacklogTaskButton(task.id)}
        </div>
        <h2>${escapeHtml(task.title)}</h2>
        ${task.more_info ? `<p>${escapeHtml(task.more_info)}</p>` : ""}
      </div>
    </article>
  `;
}

function ScheduleTime(item, timeOffset) {
  return `
    <div class="schedule-time">
      <strong>${escapeHtml(formatScheduleTime(item.startMinutes, timeOffset))}</strong>
      <span>${escapeHtml(formatScheduleTime(item.endMinutes, timeOffset))}</span>
    </div>
  `;
}
