import { PageHeader } from "../components/PageHeader.js";
import { EmptyState, LoadingState } from "../components/StateMessages.js";
import { TaskDetailModal, TaskModal, TypeBadge, taskColorVars } from "../components/TaskTable.js";
import { TASK_COLORS, TASK_STATUSES } from "../utils/constants.js";
import { escapeHtml } from "../utils/format.js";
import { ticketLinkHtml } from "../utils/projectSettings.js";

const HIDDEN_STATUSES = ["Undone", "Unfinished"];
const CLOSED_PR_STATUSES = ["Imputed", "Deployed"];

export const KANBAN_STATUSES = TASK_STATUSES.filter((status) => !HIDDEN_STATUSES.includes(status));

export function getKanbanTasks(tasks = []) {
  return tasks.filter(isKanbanTask);
}

export function KanbanPage({ tasks = [], loading = false, modalTask = undefined, detailTask = null } = {}) {
  const kanbanTasks = getKanbanTasks(tasks);
  return `
    ${PageHeader({
      eyebrow: "Tareas",
      title: "Kanban",
      description: `${kanbanTasks.length} tarea${kanbanTasks.length === 1 ? "" : "s"} en curso, agrupadas por estado y ordenadas por puntos de orden.`,
    })}
    <section class="kanban-panel">
      ${loading ? `<div class="panel">${LoadingState()}</div>` : KanbanBoard(kanbanTasks)}
    </section>
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
    ${detailTask ? TaskDetailModal(detailTask) : ""}
  `;
}

function KanbanBoard(tasks) {
  if (!tasks.length) return `<div class="panel">${EmptyState("No hay tareas activas en el tablero.")}</div>`;
  return `
    <div class="kanban-board">
      ${KANBAN_STATUSES.map((status) => KanbanColumn(status, sortByOrderPoints(tasks.filter((task) => task.task_status === status)))).join("")}
    </div>
  `;
}

function KanbanColumn(status, tasks) {
  return `
    <section class="kanban-column" style="--column-accent:${columnColor(status)};" aria-label="${escapeHtml(status)}">
      <header class="kanban-column-header">
        <h2><span class="chip-dot" aria-hidden="true"></span>${escapeHtml(status)}</h2>
        <span class="count-badge">${tasks.length}</span>
      </header>
      <div class="kanban-column-body">
        ${tasks.length ? tasks.map(KanbanCard).join("") : `<p class="kanban-column-empty">Sin tareas</p>`}
      </div>
    </section>
  `;
}

function KanbanCard(task) {
  const pending = Boolean(task.__pending);
  return `
    <article class="kanban-card ${pending ? "kanban-card-pending" : "clickable-row"}" ${pending ? "" : `data-view-task="${escapeHtml(task.id)}" tabindex="0"`} style="${taskColorVars(task)}">
      <header class="kanban-card-header">
        <span class="kanban-card-ticket">${ticketLinkHtml(task.ticket, { fallback: "" })}</span>
        <span class="kanban-card-order" title="Puntos de orden">#${escapeHtml(task.order_points ?? "-")}</span>
      </header>
      <p class="kanban-card-title">${escapeHtml(task.title)}</p>
      <footer class="kanban-card-meta">
        ${TypeBadge(task.ticket_type)}
        <span>${escapeHtml(task.priority)}</span>
        <span title="Puntos de esfuerzo">${escapeHtml(task.effort_points ?? 0)} PE</span>
        ${task.limit_date ? `<span title="Fecha límite">Límite ${escapeHtml(task.limit_date)}</span>` : ""}
        ${task.task_status === "Done" ? `<span title="Estado del PR">${escapeHtml(task.pr_status || "-")}</span>` : ""}
        ${pending ? `<span class="task-pending-badge"><span class="spinner spinner-sm" aria-hidden="true"></span>${escapeHtml(task.__pendingLabel || "Guardando...")}</span>` : ""}
      </footer>
    </article>
  `;
}

// "To do" colors depend on priority, so its column uses a representative shade.
function columnColor(status) {
  const color = TASK_COLORS[status];
  return typeof color === "string" ? color : color.Prioritaria;
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
