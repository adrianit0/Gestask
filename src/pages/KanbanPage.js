import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { TaskDetailModal, TaskModal } from "../components/TaskTable.js";
import { PR_BORDER_COLORS, TASK_COLORS, TASK_STATUSES } from "../utils/constants.js";
import { escapeHtml } from "../utils/format.js";

const HIDDEN_STATUSES = ["Undone", "Unfinished"];
const CLOSED_PR_STATUSES = ["Imputed", "Deployed"];

export const KANBAN_STATUSES = TASK_STATUSES.filter((status) => !HIDDEN_STATUSES.includes(status));

export function getKanbanTasks(tasks = []) {
  return tasks.filter(isKanbanTask);
}

export function KanbanPage({ tasks = [], loading = false, error = "", success = "", modalTask = undefined, detailTask = null } = {}) {
  const kanbanTasks = getKanbanTasks(tasks);
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Kanban</p>
        <h1>Tablero de tareas</h1>
      </div>
      <p class="kanban-summary">${kanbanTasks.length} tarea${kanbanTasks.length === 1 ? "" : "s"} en curso</p>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="panel kanban-panel">
      ${loading ? LoadingState() : KanbanBoard(kanbanTasks)}
    </section>
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
    ${detailTask ? TaskDetailModal(detailTask) : ""}
  `;
}

function KanbanBoard(tasks) {
  if (!tasks.length) return EmptyState("No hay tareas activas en el tablero.");
  return `
    <div class="kanban-board">
      ${KANBAN_STATUSES.map((status) => KanbanColumn(status, sortByOrderPoints(tasks.filter((task) => task.task_status === status)))).join("")}
    </div>
  `;
}

function KanbanColumn(status, tasks) {
  return `
    <section class="kanban-column" style="--column-accent:${TASK_COLORS[status] || "#e6e0d8"};">
      <header class="kanban-column-header">
        <h2>${escapeHtml(status)}</h2>
        <span class="kanban-column-count">${tasks.length}</span>
      </header>
      <div class="kanban-column-body">
        ${tasks.length ? tasks.map(KanbanCard).join("") : `<p class="kanban-column-empty">Sin tareas.</p>`}
      </div>
    </section>
  `;
}

function KanbanCard(task) {
  const pending = Boolean(task.__pending);
  const background = task.task_status === "To do" ? TASK_COLORS["To do"][task.priority] : TASK_COLORS[task.task_status];
  const border = task.task_status === "Done" ? PR_BORDER_COLORS[task.pr_status] : null;
  return `
    <article class="kanban-card ${pending ? "kanban-card-pending" : "clickable-row"}" ${pending ? "" : `data-view-task="${escapeHtml(task.id)}"`} style="--task-bg:${background}; --task-border:${border || "transparent"};">
      <header class="kanban-card-header">
        <span class="kanban-card-ticket">${ticketLink(task.ticket)}</span>
        <span class="kanban-card-order" title="Puntos de orden">${escapeHtml(task.order_points ?? "-")}</span>
      </header>
      <p class="kanban-card-title">${escapeHtml(task.title)}</p>
      <footer class="kanban-card-meta">
        <span>${escapeHtml(task.ticket_type || "Bug")}</span>
        <span>${escapeHtml(task.priority)}</span>
        <span title="Puntos de esfuerzo">${escapeHtml(task.effort_points ?? 0)} pts</span>
        ${task.limit_date ? `<span title="Fecha límite">Límite ${escapeHtml(task.limit_date)}</span>` : ""}
        ${task.task_status === "Done" ? `<span title="Estado del PR">${escapeHtml(task.pr_status || "-")}</span>` : ""}
        ${pending ? `<span class="task-pending-badge">${escapeHtml(task.__pendingLabel || "Guardando...")}</span>` : ""}
      </footer>
    </article>
  `;
}

function sortByOrderPoints(tasks) {
  return [...tasks].sort((first, second) => {
    const orderCompared = orderValue(second) - orderValue(first);
    if (orderCompared !== 0) return orderCompared;
    return String(first.id ?? "").localeCompare(String(second.id ?? ""));
  });
}

function orderValue(task) {
  const value = Number(task.order_points);
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

function isKanbanTask(task) {
  if (!KANBAN_STATUSES.includes(task.task_status)) return false;
  return !(task.task_status === "Done" && CLOSED_PR_STATUSES.includes(task.pr_status));
}

function ticketLink(ticket) {
  if (!ticket) return "-";
  return `<a href="https://jira.knowmadmood.com/browse/${encodeURIComponent(ticket)}" target="_blank" rel="noreferrer">${escapeHtml(ticket)}</a>`;
}
