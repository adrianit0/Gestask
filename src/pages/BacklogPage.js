import { TaskModal, TaskTable } from "../components/TaskTable.js";
import { ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { PRIORITIES, TASK_STATUSES } from "../utils/constants.js";
import { escapeHtml } from "../utils/format.js";

export function BacklogPage({ tasks = [], filters = {}, loading = false, error = "", success = "", modalTask = undefined } = {}) {
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
      <button class="secondary" data-clear-filters>Limpiar</button>
    </section>
    <section class="panel">${loading ? LoadingState() : TaskTable(tasks)}</section>
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
  `;
}
