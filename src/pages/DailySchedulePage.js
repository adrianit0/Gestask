import { DailyTaskChecklist } from "../components/DailyTasks.js";
import { BacklogTaskButton, TaskDetailModal, TaskModal } from "../components/TaskTable.js";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { PR_BORDER_COLORS, TASK_COLORS } from "../utils/constants.js";
import { buildDailySchedule, formatScheduleTime } from "../utils/dailySchedule.js";
import { escapeHtml } from "../utils/format.js";
import { ticketLinkHtml } from "../utils/projectSettings.js";

export function DailySchedulePage({ report = null, date = null, tasks = [], routineTasks = [], dailyCompletionPending = new Set(), configurations = [], minutesPerEffortPoint = 60, includeExtraHours = false, loading = false, error = "", success = "", modalTask = undefined, detailTask = null } = {}) {
  const schedule = buildDailySchedule(tasks, configurations, minutesPerEffortPoint, date, { includeExtraHours });
  const timeOffset = schedule.settings.scheduleTimeOffsetMinutes;

  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Horario diario</p>
        <h1>Horario diario</h1>
      </div>
      <div class="schedule-summary">
        ${schedule.settings.intensive ? `<span>Horario intensivo</span>` : ""}
        <span>${escapeHtml(schedule.totalEffortPoints)} / ${escapeHtml(schedule.settings.dailyEffortPoints)} PE</span>
        <span>${escapeHtml(formatScheduleTime(schedule.settings.startMinutes, timeOffset))} - ${escapeHtml(formatScheduleTime(schedule.settings.endMinutes, timeOffset))}</span>
      </div>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
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
  const label = includeExtraHours ? "Mostrar menos horas" : "(+) Incluir horas";
  return `
    <button type="button" class="schedule-include-toggle" data-toggle-extra-hours aria-pressed="${includeExtraHours}">
      ${escapeHtml(label)}
    </button>
  `;
}

function ScheduleItem(item, timeOffset = 0) {
  if (item.type === "break" || item.type === "daily") {
    const className = item.type === "break" ? "schedule-break" : "schedule-daily";
    return `
      <article class="schedule-item ${className}">
        <div class="schedule-time">
          <strong>${escapeHtml(formatScheduleTime(item.startMinutes, timeOffset))}</strong>
          <span>${escapeHtml(formatScheduleTime(item.endMinutes, timeOffset))}</span>
        </div>
        <div class="schedule-card">
          <h2>${escapeHtml(item.title)}</h2>
        </div>
      </article>
    `;
  }

  const task = item.task;
  const ticket = ticketLinkHtml(task.ticket);
  const background = task.task_status === "To do" ? TASK_COLORS["To do"][task.priority] : TASK_COLORS[task.task_status];
  const border = task.task_status === "Done" ? PR_BORDER_COLORS[task.pr_status] : null;
  const visualStyle = `--task-bg:${background || "#fff4e7"}; --task-border:${border || "transparent"};`;

  return `
    <article class="schedule-item schedule-task" data-schedule-task="${escapeHtml(task.id)}" style="${visualStyle}">
      <div class="schedule-time">
        <strong>${escapeHtml(formatScheduleTime(item.startMinutes, timeOffset))}</strong>
        <span>${escapeHtml(formatScheduleTime(item.endMinutes, timeOffset))}</span>
      </div>
      <div class="schedule-card">
        <div class="schedule-card-top">
          <span>${ticket}</span>
          <span>${escapeHtml(task.effort_points)} PE</span>
          ${item.partial ? `<span class="schedule-partial-tag">Tarea parcial</span>` : ""}
          <span>Orden ${escapeHtml(task.order_points ?? "-")}</span>
          ${BacklogTaskButton(task.id)}
        </div>
        <h2>${escapeHtml(task.title)}</h2>
        ${task.more_info ? `<p>${escapeHtml(task.more_info)}</p>` : ""}
      </div>
    </article>
  `;
}
