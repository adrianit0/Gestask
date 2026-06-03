import { PRIORITIES, PR_BORDER_COLORS, PR_STATUSES, TASK_COLORS, TASK_STATUSES } from "../utils/constants.js";
import { escapeHtml } from "../utils/format.js";

export function TaskTable(tasks, { readonly = false } = {}) {
  if (!tasks.length) return `<div class="state empty">No hay tareas para mostrar.</div>`;
  return `
    <div class="table-wrap">
      <table class="task-table">
        <thead>
          <tr>
            <th>Ticket</th><th>Asignación</th><th>Finalización</th><th>Título</th><th>Esfuerzo</th><th>Orden</th><th>Prioridad</th><th>Estado</th><th>PR</th><th>Más info</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>${tasks.map((task) => row(task, readonly)).join("")}</tbody>
      </table>
    </div>
  `;
}

function row(task, readonly) {
  const background = task.task_status === "To do" ? TASK_COLORS["To do"][task.priority] : TASK_COLORS[task.task_status];
  const border = task.task_status === "Done" ? PR_BORDER_COLORS[task.pr_status] : null;
  return `
    <tr style="background:${background}; ${border ? `box-shadow: inset 4px 0 0 ${border};` : ""}">
      <td>${ticketCell(task.ticket)}</td>
      <td>${escapeHtml(task.assigned_date)}</td>
      <td>${escapeHtml(task.finished_date || "-")}</td>
      <td>${escapeHtml(task.title)}</td>
      <td>${escapeHtml(task.effort_points)}</td>
      <td>${escapeHtml(task.order_points ?? "-")}</td>
      <td>${escapeHtml(task.priority)}</td>
      <td>${statusSelect(task, readonly)}</td>
      <td>${prSelect(task, readonly)}</td>
      <td>${escapeHtml(task.more_info || "")}</td>
      <td><button class="icon-button" data-edit-task="${task.id}" ${readonly ? "disabled" : ""} aria-label="Editar tarea">Editar</button></td>
    </tr>
  `;
}

function ticketCell(ticket) {
  if (!ticket) return "-";
  const safeTicket = escapeHtml(ticket);
  return `<a href="https://jira.knowmadmood.com/browse/${encodeURIComponent(ticket)}" target="_blank" rel="noreferrer">${safeTicket}</a>`;
}

function statusSelect(task, readonly) {
  return `<select data-task-status="${task.id}" ${readonly ? "disabled" : ""}>${TASK_STATUSES.map((status) => `<option ${task.task_status === status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}

function prSelect(task, readonly) {
  const disabled = readonly || task.task_status !== "Done";
  return `<select data-pr-status="${task.id}" ${disabled ? "disabled" : ""}>${PR_STATUSES.map((status) => `<option ${task.pr_status === status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}

export function TaskModal(task = null) {
  const isEdit = Boolean(task);
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div class="modal-header">
          <h2 id="task-modal-title">${isEdit ? "Editar tarea" : "Crear tarea"}</h2>
          <button class="icon-button" data-close-modal aria-label="Cerrar">X</button>
        </div>
        <form id="task-form" class="form-grid">
          <input type="hidden" name="id" value="${escapeHtml(task?.id || "")}" />
          <label>Ticket<input name="ticket" value="${escapeHtml(task?.ticket || "")}" /></label>
          <label>Título<input name="title" required value="${escapeHtml(task?.title || "")}" /></label>
          <label>Fecha asignación<input name="assigned_date" type="date" required value="${escapeHtml(task?.assigned_date || new Date().toISOString().slice(0, 10))}" /></label>
          <label>Fecha finalización<input name="finished_date" type="date" value="${escapeHtml(task?.finished_date || "")}" ${!isEdit || task?.task_status !== "Done" ? "disabled" : ""} /></label>
          <label>Punto de esfuerzo<input name="effort_points" type="number" min="0" value="${escapeHtml(task?.effort_points ?? 3)}" /></label>
          <label>Punto de orden<input name="order_points" type="number" value="${escapeHtml(task?.order_points ?? "")}" /></label>
          <label>Prioridad<select name="priority">${PRIORITIES.map((priority) => `<option ${((task?.priority || "Menor") === priority) ? "selected" : ""}>${priority}</option>`).join("")}</select></label>
          ${isEdit ? `<label>Estado tarea<select name="task_status">${TASK_STATUSES.map((status) => `<option ${(task?.task_status === status) ? "selected" : ""}>${status}</option>`).join("")}</select></label>` : ""}
          ${isEdit ? `<label>Estado PR<select name="pr_status" ${task?.task_status !== "Done" ? "disabled" : ""}>${PR_STATUSES.map((status) => `<option ${(task?.pr_status === status) ? "selected" : ""}>${status}</option>`).join("")}</select></label>` : ""}
          <label class="span-2">Más info<textarea name="more_info">${escapeHtml(task?.more_info || "")}</textarea></label>
          <div class="modal-actions span-2">
            <button type="button" class="secondary" data-close-modal>Cancelar</button>
            <button type="submit" class="primary">Guardar</button>
          </div>
        </form>
      </section>
    </div>
  `;
}
