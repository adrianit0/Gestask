import { DailyTaskChecklistItem, formatDailyReportDate, getDailyPendingSummary } from "../components/DailyTasks.js";
import { PageHeader, plusIcon } from "../components/PageHeader.js";
import { EmptyState, LoadingState } from "../components/StateMessages.js";
import { TaskModal } from "../components/TaskTable.js";
import { escapeHtml } from "../utils/format.js";
import { ticketLinkHtml } from "../utils/projectSettings.js";

export function DailyRoutinePage({ tasks = [], pending = {}, completionPendingKeys = new Set(), loading = false, modalTask = undefined } = {}) {
  const activeTasks = tasks.filter((task) => !task.finished_date);
  const finishedTasks = tasks.filter((task) => task.finished_date);

  return `
    ${PageHeader({
      eyebrow: "Día a día",
      title: "Diarias",
      description: "Tareas recurrentes que se añaden a cada parte diario hasta que se finalizan.",
      actions: `${CompleteAllButton(pending, completionPendingKeys)}<button class="primary" data-open-daily-task-modal>${plusIcon()}Nueva tarea diaria</button>`,
    })}
    <section class="panel daily-routine-panel">
      <h2 class="daily-routine-heading">Pendientes de realizar <span class="count-badge">${getDailyPendingSummary(pending).count}</span></h2>
      ${PendingGroups(pending, completionPendingKeys)}
    </section>
    <section class="panel daily-routine-panel">
      <h2 class="daily-routine-heading">Activas <span class="count-badge">${activeTasks.length}</span></h2>
      ${loading ? LoadingState() : activeTasks.length ? DailyRoutineTable(activeTasks) : EmptyState("No hay tareas diarias activas.")}
    </section>
    ${finishedTasks.length ? `
      <section class="panel daily-routine-panel">
        <details>
          <summary class="daily-routine-heading">Finalizadas <span class="count-badge">${finishedTasks.length}</span></summary>
          ${DailyRoutineTable(finishedTasks, { finished: true })}
        </details>
      </section>
    ` : ""}
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
  `;
}

function CompleteAllButton(pending, completionPendingKeys) {
  const { count } = getDailyPendingSummary(pending);
  if (!count) return "";
  const saving = completionPendingKeys.size > 0;
  return `<button class="secondary" type="button" data-complete-all-daily ${saving ? "disabled" : ""}>${saving ? "Guardando..." : `Marcar todas como realizadas (${count})`}</button>`;
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
        <h3>${escapeHtml(capitalize(formatDailyReportDate(date)))} <span class="daily-pending-tag">${late ? "Atrasada" : "Hoy"}</span></h3>
        <ul class="daily-checklist">
          ${dateItems.map((item) => DailyTaskChecklistItem({ id: item.task_id, ticket: item.ticket, title: item.title, more_info: item.more_info, completed_at: null }, date, completionPendingKeys)).join("")}
        </ul>
      </div>
    `;
  }).join("");
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function DailyRoutineTable(tasks, { finished = false } = {}) {
  return `
    <div class="table-wrap">
      <table class="data-table daily-routine-table">
        <thead>
          <tr><th>Tarea</th><th class="cell-date">${finished ? "Finalizada" : "Desde"}</th><th class="actions-cell"><span class="visually-hidden">Acciones</span></th></tr>
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
      <td>
        <div class="task-summary">
          ${task.ticket || pending ? `
            <div class="task-summary-meta">
              ${task.ticket ? `<span class="task-ticket">${ticketLinkHtml(task.ticket)}</span>` : ""}
              ${pending ? `<span class="task-pending-badge"><span class="spinner spinner-sm" aria-hidden="true"></span>${escapeHtml(task.__pendingLabel || "Guardando...")}</span>` : ""}
            </div>
          ` : ""}
          <p class="task-title">${escapeHtml(task.title)}</p>
          ${task.more_info ? `<p class="task-more-info">${escapeHtml(task.more_info)}</p>` : ""}
        </div>
      </td>
      <td class="cell-date">${escapeHtml((finished ? task.finished_date : task.assigned_date) || "-")}</td>
      <td class="actions-cell">
        <div class="task-actions">
          <button type="button" class="secondary button-sm" data-edit-daily-task="${id}" ${pending ? "disabled" : ""}>Editar</button>
          ${finished
            ? `<button type="button" class="secondary button-sm" data-reactivate-daily-task="${id}" ${pending ? "disabled" : ""}>Reactivar</button>`
            : `<button type="button" class="secondary button-sm" data-finish-daily-task="${id}" ${pending ? "disabled" : ""}>Finalizar</button>`}
        </div>
      </td>
    </tr>
  `;
}
