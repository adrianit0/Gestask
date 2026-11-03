import { PageHeader, plusIcon } from "../components/PageHeader.js";
import { TaskDetailModal, TaskModal, TaskTable } from "../components/TaskTable.js";
import { LoadingState } from "../components/StateMessages.js";
import { PRIORITIES, TASK_COLORS, TASK_STATUSES } from "../utils/constants.js";
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

export function BacklogPage({ tasks = [], filters = {}, loading = false, modalTask = undefined, detailTask = null } = {}) {
  const selectedStatuses = Array.isArray(filters.statuses) ? filters.statuses : [];
  const activeFilterCount = [filters.search, filters.priority, filters.date, selectedStatuses.length, filters.show_history].filter(Boolean).length;
  const canClear = Object.values(filters).some((value) => (Array.isArray(value) ? value.length : Boolean(value)));
  return `
    ${PageHeader({
      eyebrow: "Tareas",
      title: "Backlog",
      description: "Todas tus tareas. Filtra, ordena y pulsa una tarea para ver su detalle.",
      actions: `<button class="primary" data-open-task-modal>${plusIcon()}Crear tarea</button>`,
    })}
    <section class="panel toolbar-panel backlog-filters" aria-label="Filtros">
      <div class="toolbar">
        <label class="search-field">
          <span class="visually-hidden">Texto a buscar</span>
          ${searchIcon()}
          <input data-filter="search" type="search" placeholder="Buscar por título, ticket o info" value="${escapeHtml(filters.search || "")}" />
        </label>
        <label class="toolbar-field">Prioridad<select data-filter="priority"><option value="">Todas</option>${PRIORITIES.map((priority) => `<option value="${priority}" ${filters.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}</select></label>
        <label class="toolbar-field" title="Fecha asignada o finalizada">Fecha<input data-filter="date" type="date" value="${escapeHtml(filters.date || "")}" /></label>
        <label class="toolbar-field">Ordenar por<select data-filter="sort_by">${SORT_OPTIONS.map(([value, label]) => `<option value="${value}" ${(filters.sort_by || "created_at") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label class="toolbar-field">Dirección<select data-filter="sort_direction">
          <option value="desc" ${(filters.sort_direction || "desc") === "desc" ? "selected" : ""}>Descendente</option>
          <option value="asc" ${filters.sort_direction === "asc" ? "selected" : ""}>Ascendente</option>
        </select></label>
      </div>
      <div class="toolbar toolbar-secondary">
        <fieldset class="chip-group">
          <legend>Estados</legend>
          ${TASK_STATUSES.map((status) => `
            <label class="chip" title="${escapeHtml(STATUS_DESCRIPTIONS[status] || status)}">
              <input data-status-filter value="${escapeHtml(status)}" type="checkbox" ${selectedStatuses.includes(status) ? "checked" : ""} />
              <span class="chip-dot" style="--chip-color:${statusColor(status)}" aria-hidden="true"></span>
              ${escapeHtml(status)}
            </label>
          `).join("")}
        </fieldset>
        <div class="toolbar-end">
          <label class="switch"><input data-filter-check="show_history" type="checkbox" role="switch" ${filters.show_history ? "checked" : ""} /><span class="switch-track" aria-hidden="true"></span>Histórico completo</label>
          <button class="text-button" data-clear-filters ${canClear ? "" : "disabled"}>Limpiar filtros${activeFilterCount ? ` (${activeFilterCount})` : ""}</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <h2>Tareas <span class="count-badge">${tasks.length}</span></h2>
      </div>
      ${loading ? LoadingState() : TaskTable(tasks, { mode: "backlog" })}
    </section>
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
    ${detailTask ? TaskDetailModal(detailTask) : ""}
  `;
}

function statusColor(status) {
  const color = TASK_COLORS[status];
  return typeof color === "string" ? color : color.Prioritaria;
}

function searchIcon() {
  return `<svg class="search-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>`;
}
