import { TaskDetailModal, TaskModal, TaskTable } from "../components/TaskTable.js";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { escapeHtml, todayIso } from "../utils/format.js";

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

export function DailyTasksPage({ date = todayIso(), report = null, tasks = [], editable = false, loading = false, error = "", success = "", modalTask = undefined, detailTask = null, sort = {} } = {}) {
  const historical = report && !editable;
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Tareas Diarias</p>
        <h1>Parte diario</h1>
      </div>
      <button class="primary" data-create-daily-report>Nuevo día</button>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="panel filters">
      <label>Fecha<input type="date" data-daily-date value="${escapeHtml(date)}" /></label>
      <select data-daily-sort="sort_by">${SORT_OPTIONS.map(([value, label]) => `<option value="${value}" ${(sort.sort_by || "order_points") === value ? "selected" : ""}>Ordenar por ${label}</option>`).join("")}</select>
      <select data-daily-sort="sort_direction">
        <option value="desc" ${(sort.sort_direction || "desc") === "desc" ? "selected" : ""}>Descendente</option>
        <option value="asc" ${sort.sort_direction === "asc" ? "selected" : ""}>Ascendente</option>
      </select>
      <button class="secondary" data-load-daily-report>Consultar</button>
    </section>
    ${historical ? `<div class="state warning">Modo histórico: solo lectura.</div>` : ""}
    <section class="panel">
      ${loading ? LoadingState() : report ? TaskTable(tasks, { readonly: !editable, mode: "daily" }) : EmptyState("No existe parte diario para esta fecha.")}
    </section>
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
    ${detailTask ? TaskDetailModal(detailTask, { readonly: !editable }) : ""}
  `;
}

