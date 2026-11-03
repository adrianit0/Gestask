import { PageHeader, plusIcon } from "../components/PageHeader.js";
import { DayPicker } from "../components/PeriodControls.js";
import { TaskDetailModal, TaskModal, TaskTable } from "../components/TaskTable.js";
import { EmptyState, LoadingState } from "../components/StateMessages.js";
import { formatDailyReportDate } from "../components/DailyTasks.js";
import { todayIso } from "../utils/format.js";

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

export function DailyTasksPage({ date = todayIso(), report = null, tasks = [], editable = false, loading = false, modalTask = undefined, detailTask = null, sort = {} } = {}) {
  const historical = report && !editable;
  return `
    ${PageHeader({
      eyebrow: "Día a día",
      title: "Tareas diarias",
      description: report ? `Parte del ${formatDailyReportDate(report.report_date)}.` : "Parte diario de trabajo.",
      actions: `<button class="primary" data-create-daily-report>${plusIcon()}Nuevo día</button>`,
    })}
    <section class="panel toolbar-panel">
      <div class="toolbar">
        ${DayPicker({ date })}
        <label class="toolbar-field">Ordenar por<select data-daily-sort="sort_by">${SORT_OPTIONS.map(([value, label]) => `<option value="${value}" ${(sort.sort_by || "order_points") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label class="toolbar-field">Dirección<select data-daily-sort="sort_direction">
          <option value="desc" ${(sort.sort_direction || "desc") === "desc" ? "selected" : ""}>Descendente</option>
          <option value="asc" ${sort.sort_direction === "asc" ? "selected" : ""}>Ascendente</option>
        </select></label>
      </div>
    </section>
    ${historical ? `<div class="state warning">Modo histórico: el parte de un día anterior es de solo lectura.</div>` : ""}
    <section class="panel">
      ${report ? `<div class="panel-header"><h2>Tareas del parte <span class="count-badge">${tasks.length}</span></h2></div>` : ""}
      ${loading ? LoadingState() : report ? TaskTable(tasks, { readonly: !editable, mode: "daily" }) : EmptyState("No existe parte diario para esta fecha.")}
    </section>
    ${modalTask !== undefined ? TaskModal(modalTask) : ""}
    ${detailTask ? TaskDetailModal(detailTask, { readonly: !editable }) : ""}
  `;
}
