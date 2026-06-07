import { TaskDetailModal, TaskModal, TaskTable } from "../components/TaskTable.js";
import { ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { PRIORITIES, TASK_STATUSES } from "../utils/constants.js";
import { escapeHtml } from "../utils/format.js";

const SORT_OPTIONS = [
  ["order_points", "Orden"],
  ["scoring", "Scoring"],
  ["assigned_date", "Fecha inicio"],
  ["limit_date", "Fecha límite"],
  ["finished_date", "Fecha finalización"],
  ["priority", "Prioridad"],
  ["task_status", "Estado"],
  ["pr_status", "PR"],
  ["ticket_type", "Tipo"],
  ["created_at", "Creación"],
  ["updated_at", "Actualización"],
];

const STATUS_DESCRIPTIONS = {
  "To do": "Pendiente de empezar.",
  Doing: "Trabajo en curso.",
  Draft: "Preparación inicial.",
  Undone: "Descartada o no realizada.",
  Unfinished: "No cerrada en el parte.",
  "Need Fix": "Requiere corrección.",
  Waiting: "Bloqueada o en espera.",
  Done: "Finalizada.",
  Warning: "Requiere atención.",
};

export function BacklogPage({ tasks = [], filters = {}, loading = false, error = "", success = "", modalTask = undefined, detailTask = null } = {}) {
  const selectedStatuses = Array.isArray(filters.statuses) ? filters.statuses : [];
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
    <section class="panel filters backlog-filters">
      <label>Texto a buscar<input data-filter="search" placeholder="Título, ticket o info" value="${escapeHtml(filters.search || "")}" /></label>
      <label>Prioridad<select data-filter="priority"><option value="">Todas las prioridades</option>${PRIORITIES.map((priority) => `<option value="${priority}" ${filters.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}</select></label>
      <label>Fecha asignada o finalizada<input data-filter="date" type="date" value="${escapeHtml(filters.date || "")}" /></label>
      <label>Campo de ordenación<select data-filter="sort_by">${SORT_OPTIONS.map(([value, label]) => `<option value="${value}" ${(filters.sort_by || "created_at") === value ? "selected" : ""}>Ordenar por ${label}</option>`).join("")}</select></label>
      <label>Dirección del orden<select data-filter="sort_direction">
        <option value="desc" ${(filters.sort_direction || "desc") === "desc" ? "selected" : ""}>Descendente</option>
        <option value="asc" ${filters.sort_direction === "asc" ? "selected" : ""}>Ascendente</option>
      </select></label>
      <label class="checkbox-label backlog-history-toggle"><input data-filter-check="show_history" type="checkbox" ${filters.show_history ? "checked" : ""} /> Mostrar histórico completo</label>
      <fieldset class="status-filter-grid">
        <legend>Estados a incluir</legend>
        ${TASK_STATUSES.map((status) => `
          <label class="status-filter-option">
            <span>${escapeHtml(STATUS_DESCRIPTIONS[status] || status)}</span>
            <input data-status-filter value="${escapeHtml(status)}" type="checkbox" ${selectedStatuses.includes(status) ? "checked" : ""} />
            <strong>${escapeHtml(status)}</strong>
          </label>
        `).join("")}
      </fieldset>
      <button class="secondary" data-clear-filters>Limpiar</button>
    </section>
    <section class="panel">${loading ? LoadingState() : TaskTable(tasks, { mode: "backlog" })}</section>
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
    ${detailTask ? TaskDetailModal(detailTask) : ""}
  `;
}

