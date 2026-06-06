import { PRIORITIES, PR_BORDER_COLORS, PR_STATUSES, TASK_COLORS, TASK_STATUSES } from "../utils/constants.js";
import { escapeHtml } from "../utils/format.js";

export function TaskTable(tasks, options = {}) {
  return taskTable(tasks, options);
}

function taskTable(tasks, { readonly = false, mode = "full" } = {}) {
  if (!tasks.length) return `<div class="state empty">No hay tareas para mostrar.</div>`;
  const compact = mode === "backlog" || mode === "daily";
  return `
    <div class="table-wrap">
      <table class="task-table task-table-${mode}">
        <thead>
          ${header(mode)}
        </thead>
        <tbody>${tasks.map((task) => row(task, { readonly, mode, compact })).join("")}</tbody>
      </table>
    </div>
  `;
}

function header(mode) {
  if (mode === "backlog") {
    return `<tr><th>Ticket</th><th>Asignación</th><th>Finalización</th><th class="title-column">Título</th><th>Acciones</th></tr>`;
  }
  if (mode === "daily") {
    return `<tr><th>Ticket</th><th>Asignación</th><th>Finalización</th><th class="title-column">Título</th><th>Estado</th><th>PR</th><th>Acciones</th></tr>`;
  }
  return `<tr><th>Ticket</th><th>Asignación</th><th>Finalización</th><th class="title-column">Título</th><th>Esfuerzo</th><th>Orden</th><th>Prioridad</th><th>Estado</th><th>PR</th><th>Más info</th><th>Acciones</th></tr>`;
}

function row(task, { readonly, mode, compact }) {
  const background = task.task_status === "To do" ? TASK_COLORS["To do"][task.priority] : TASK_COLORS[task.task_status];
  const border = task.task_status === "Done" ? PR_BORDER_COLORS[task.pr_status] : null;
  return `
    <tr class="${compact ? "clickable-row" : ""}" ${compact ? `data-view-task="${task.id}"` : ""} style="background:${background}; ${border ? `box-shadow: inset 4px 0 0 ${border};` : ""}">
      <td>${ticketCell(task.ticket)}</td>
      <td>${escapeHtml(task.assigned_date)}</td>
      <td>${escapeHtml(task.finished_date || "-")}</td>
      <td class="task-title-cell">${escapeHtml(task.title)}</td>
      ${mode === "full" ? `
        <td>${escapeHtml(task.effort_points)}</td>
        <td>${escapeHtml(task.order_points ?? "-")}</td>
        <td>${escapeHtml(task.priority)}</td>
        <td>${statusSelect(task, readonly)}</td>
        <td>${prSelect(task, readonly)}</td>
        <td>${escapeHtml(task.more_info || "")}</td>
      ` : ""}
      ${mode === "daily" ? `<td>${statusSelect(task, readonly)}</td><td>${prSelect(task, readonly)}</td>` : ""}
      <td><button class="icon-button edit-icon-button" data-edit-task="${task.id}" ${readonly ? "disabled" : ""} aria-label="Editar tarea">${editIcon()}</button></td>
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

function editIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"></path>
      <path d="m14 8 2 2"></path>
    </svg>
  `;
}

export function TaskDetailModal(task, { readonly = false } = {}) {
  if (!task) return "";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal task-detail-modal" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Detalle de tarea</p>
            <h2 id="task-detail-title">${escapeHtml(task.title)}</h2>
          </div>
          <button class="icon-button" data-close-detail-modal aria-label="Cerrar">X</button>
        </div>
        <div class="detail-grid">
          ${detailItem("Ticket", task.ticket ? ticketCell(task.ticket) : "-")}
          ${detailItem("Título", escapeHtml(task.title), "span-2")}
          ${detailItem("Fecha asignación", escapeHtml(task.assigned_date))}
          ${detailItem("Fecha finalización", escapeHtml(task.finished_date || "-"))}
          ${detailItem("Esfuerzo", escapeHtml(task.effort_points))}
          ${detailItem("Orden", escapeHtml(task.order_points ?? "-"))}
          ${detailItem("Prioridad", escapeHtml(task.priority))}
          ${detailItem("Estado", statusSelect(task, readonly))}
          ${detailItem("PR", prSelect(task, readonly))}
          ${detailItem("Más info", escapeHtml(task.more_info || "-"), "span-2 detail-info")}
        </div>
        <div class="modal-actions">
          <button type="button" class="secondary" data-close-detail-modal>Cerrar</button>
        </div>
      </section>
    </div>
  `;
}

function detailItem(label, value, className = "") {
  return `
    <article class="detail-item ${className}">
      <span>${label}</span>
      <div class="detail-value">${value}</div>
    </article>
  `;
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
