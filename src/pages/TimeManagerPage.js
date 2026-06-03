import { EmptyState, ErrorMessage, SuccessMessage } from "../components/StateMessages.js";
import { escapeHtml, todayIso } from "../utils/format.js";

export function TimeManagerPage({ tasks = [], entries = [], editingEntry = null, error = "", success = "" } = {}) {
  const entry = editingEntry ?? {};
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Gestor de Tiempos</p>
        <h1>Registro horario</h1>
      </div>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="time-layout">
      <form id="time-entry-form" class="panel time-form">
        <input type="hidden" name="id" value="${escapeHtml(entry.id || "")}" />
        <label>Tarea
          <select name="task_id" required>
            <option value="">Selecciona una tarea</option>
            ${tasks.map((task) => `<option value="${task.id}" ${entry.task_id === task.id ? "selected" : ""}>${escapeHtml(task.ticket ? `${task.ticket} · ${task.title}` : task.title)}</option>`).join("")}
          </select>
        </label>
        <label>Fecha<input type="date" name="date" required value="${escapeHtml(entry.date || todayIso())}" /></label>
        <label>Inicio<input type="time" name="start_time" required value="${escapeHtml(entry.start_time || "")}" /></label>
        <label>Fin<input type="time" name="end_time" required value="${escapeHtml(entry.end_time || "")}" /></label>
        <label class="span-2">Notas<textarea name="notes" placeholder="Contexto, bloqueo o entrega asociada">${escapeHtml(entry.notes || "")}</textarea></label>
        <div class="modal-actions span-2">
          ${editingEntry ? `<button type="button" class="secondary" data-cancel-time-edit>Cancelar edición</button>` : ""}
          <button type="submit" class="primary">${editingEntry ? "Actualizar registro" : "Añadir registro"}</button>
        </div>
      </form>
      <section class="panel">
        <div class="metric-grid">
          ${TimeMetric("Horas totales", formatHours(totalMinutes(entries)))}
          ${TimeMetric("Registros", entries.length)}
          ${TimeMetric("Tareas medidas", new Set(entries.map((entryItem) => entryItem.task_id)).size)}
        </div>
      </section>
    </section>
    <section class="panel">
      <h2>Historial</h2>
      ${entries.length ? TimeEntriesTable(entries, tasks) : EmptyState("Aún no hay registros horarios.")}
    </section>
  `;
}

function TimeMetric(label, value) {
  return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function TimeEntriesTable(entries, tasks) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  return `
    <div class="table-wrap">
      <table class="task-table time-table">
        <thead><tr><th>Fecha</th><th>Tarea</th><th>Inicio</th><th>Fin</th><th>Duración</th><th>Notas</th><th>Acciones</th></tr></thead>
        <tbody>
          ${entries.map((entry) => {
            const task = taskById.get(entry.task_id);
            return `
              <tr>
                <td>${escapeHtml(entry.date)}</td>
                <td>${escapeHtml(task ? (task.ticket ? `${task.ticket} · ${task.title}` : task.title) : "Tarea no encontrada")}</td>
                <td>${escapeHtml(entry.start_time)}</td>
                <td>${escapeHtml(entry.end_time)}</td>
                <td>${formatHours(entryMinutes(entry))}</td>
                <td>${escapeHtml(entry.notes)}</td>
                <td class="row-actions">
                  <button class="icon-button" data-edit-time-entry="${entry.id}">Editar</button>
                  <button class="icon-button danger-button" data-delete-time-entry="${entry.id}">Borrar</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function totalMinutes(entries) {
  return entries.reduce((sum, entry) => sum + entryMinutes(entry), 0);
}

function entryMinutes(entry) {
  const [startHour, startMinute] = entry.start_time.split(":").map(Number);
  const [endHour, endMinute] = entry.end_time.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return Math.max(0, end - start);
}

function formatHours(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}
