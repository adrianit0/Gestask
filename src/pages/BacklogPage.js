import { TaskDetailModal, TaskModal, TaskTable } from "../components/TaskTable.js";
import { ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { PRIORITIES, TASK_STATUSES } from "../utils/constants.js";
import { escapeHtml } from "../utils/format.js";

const SORT_OPTIONS = [
  ["order_points", "Orden"],
  ["scoring", "Scoring"],
  ["assigned_date", "Fecha inicio"],
  ["limit_date", "Fecha límite"],
  ["priority", "Prioridad"],
  ["task_status", "Estado"],
  ["pr_status", "PR"],
  ["ticket_type", "Tipo"],
  ["created_at", "Creación"],
  ["updated_at", "Actualización"],
];

export function BacklogPage({ tasks = [], filters = {}, loading = false, error = "", success = "", modalTask = undefined, detailTask = null } = {}) {
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Backlog</p>
        <h1>Tareas</h1>
      </div>
      <button class="primary" data-open-task-modal>Crear tarea</button>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="panel filters">
      <input data-filter="search" placeholder="Buscar por título, ticket o info" value="${escapeHtml(filters.search || "")}" />
      <select data-filter="status"><option value="">Todos los estados</option>${TASK_STATUSES.map((status) => `<option value="${status}" ${filters.status === status ? "selected" : ""}>${status}</option>`).join("")}</select>
      <select data-filter="priority"><option value="">Todas las prioridades</option>${PRIORITIES.map((priority) => `<option value="${priority}" ${filters.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}</select>
      <input data-filter="date" type="date" value="${escapeHtml(filters.date || "")}" />
      <select data-filter="sort_by">${SORT_OPTIONS.map(([value, label]) => `<option value="${value}" ${(filters.sort_by || "created_at") === value ? "selected" : ""}>Ordenar por ${label}</option>`).join("")}</select>
      <select data-filter="sort_direction">
        <option value="desc" ${(filters.sort_direction || "desc") === "desc" ? "selected" : ""}>Descendente</option>
        <option value="asc" ${filters.sort_direction === "asc" ? "selected" : ""}>Ascendente</option>
      </select>
      <button class="secondary" data-clear-filters>Limpiar</button>
    </section>
    <section class="panel">${loading ? LoadingState() : TaskTable(tasks, { mode: "backlog" })}</section>
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
    ${detailTask ? TaskDetailModal(detailTask) : ""}
  `;
}

