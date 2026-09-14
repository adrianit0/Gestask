import { DailyTaskChecklistItem, formatDailyReportDate, getDailyPendingSummary } from "../components/DailyTasks.js";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { TaskModal } from "../components/TaskTable.js";
import { escapeHtml } from "../utils/format.js";
import { ticketLinkHtml } from "../utils/projectSettings.js";

export function DailyRoutinePage({ tasks = [], pending = {}, completionPendingKeys = new Set(), loading = false, error = "", success = "", modalTask = undefined } = {}) {
  const activeTasks = tasks.filter((task) => !task.finished_date);
  const finishedTasks = tasks.filter((task) => task.finished_date);

  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Tareas de tipo Diaria</p>
        <h1>Diarias</h1>
      </div>
      <button class="primary" data-open-daily-task-modal>Nueva tarea diaria</button>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="panel daily-routine-panel">
      <h2 class="daily-routine-heading">Pendientes de realizar</h2>
      ${PendingGroups(pending, completionPendingKeys)}
    </section>
    <section class="panel daily-routine-panel">
      <h2 class="daily-routine-heading">Activas <span>${activeTasks.length}</span></h2>
      ${loading ? LoadingState() : activeTasks.length ? DailyRoutineTable(activeTasks) : EmptyState("No hay tareas diarias activas.")}
    </section>
    ${finishedTasks.length ? `
      <section class="panel daily-routine-panel">
        <details>
          <summary class="daily-routine-heading">Finalizadas <span>${finishedTasks.length}</span></summary>
          ${DailyRoutineTable(finishedTasks, { finished: true })}
        </details>
      </section>
    ` : ""}
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
  `;
}

function PendingGroups(pending, completionPendingKeys) {
  const { today, overdue, todayItems } = getDailyPendingSummary(pending);
  const items = [...overdue, ...todayItems];
  if (!items.length) return EmptyState("Todas las tareas diarias están realizadas.");

  const itemsByDate = new Map();
  items.forEach((item) => itemsByDate.set(item.report_date, [...(itemsByDate.get(item.report_date) ?? []), item]));

  return [...itemsByDate.entries()].map(([date, dateItems]) => {
    const late = date < today;
    return `
      <div class="daily-pending-group ${late ? "late" : "today"}">
        <h3>${escapeHtml(formatDailyReportDate(date))} <span class="daily-pending-tag">${late ? "Atrasada" : "Hoy"}</span></h3>
        <ul class="daily-checklist">
          ${dateItems.map((item) => DailyTaskChecklistItem({ id: item.task_id, ticket: item.ticket, title: item.title, more_info: item.more_info, completed_at: null }, date, completionPendingKeys)).join("")}
        </ul>
      </div>
    `;
  }).join("");
}

function DailyRoutineTable(tasks, { finished = false } = {}) {
  return `
    <div class="table-wrap">
      <table class="daily-routine-table">
        <thead>
          <tr><th>Ticket</th><th>Título</th><th>${finished ? "Finalizada" : "Desde"}</th><th class="actions-column">Acciones</th></tr>
        </thead>
        <tbody>${tasks.map((task) => DailyRoutineRow(task, finished)).join("")}</tbody>
      </table>
    </div>
  `;
}

function DailyRoutineRow(task, finished) {
  const pending = Boolean(task.__pending);
  const id = escapeHtml(task.id);

  return `
    <tr class="${pending ? "task-pending-row" : ""}">
      <td>${task.ticket ? ticketLinkHtml(task.ticket) : "-"}</td>
      <td>
        <div class="task-title-line">
          <span>${escapeHtml(task.title)}</span>
          ${pending ? `<span class="task-pending-badge">${escapeHtml(task.__pendingLabel || "Guardando...")}</span>` : ""}
        </div>
        ${task.more_info ? `<div class="task-more-info">${escapeHtml(task.more_info)}</div>` : ""}
      </td>
      <td>${escapeHtml((finished ? task.finished_date : task.assigned_date) || "-")}</td>
      <td class="actions-cell">
        <div class="task-actions">
          <button type="button" class="secondary" data-edit-daily-task="${id}" ${pending ? "disabled" : ""}>Editar</button>
          ${finished
            ? `<button type="button" class="secondary" data-reactivate-daily-task="${id}" ${pending ? "disabled" : ""}>Reactivar</button>`
            : `<button type="button" class="secondary" data-finish-daily-task="${id}" ${pending ? "disabled" : ""}>Finalizar</button>`}
        </div>
      </td>
    </tr>
  `;
}
