import { TaskTable } from "../components/TaskTable.js";
import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { escapeHtml, todayIso } from "../utils/format.js";

export function DailyTasksPage({ date = todayIso(), report = null, tasks = [], editable = false, loading = false, error = "", success = "" } = {}) {
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
      <button class="secondary" data-load-daily-report>Consultar</button>
    </section>
    ${historical ? `<div class="state warning">Modo histórico: solo lectura.</div>` : ""}
    <section class="panel">
      ${loading ? LoadingState() : report ? TaskTable(tasks, { readonly: !editable }) : EmptyState("No existe parte diario para esta fecha.")}
    </section>
  `;
}
