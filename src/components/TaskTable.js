import { PRIORITIES, PR_BORDER_COLORS, PR_STATUSES, TASK_COLORS, TASK_PR_STATUSES, TASK_STATUSES, TICKET_TYPES } from "../utils/constants.js";
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
    return `<tr><th>Ticket</th><th>Tipo</th><th>Asignación</th><th>Límite</th><th>Scoring</th><th>Puntos de Orden</th><th class="actions-column">Acciones</th></tr>`;
  }
  if (mode === "daily") {
    return `<tr><th>Ticket</th><th>Tipo</th><th>Asignación</th><th>Límite</th><th>Scoring</th><th>Puntos de Orden</th><th class="status-column">Estado</th><th class="pr-column">PR</th></tr>`;
  }
  return `<tr><th>Ticket</th><th>Tipo</th><th>Asignación</th><th>Límite</th><th>Finalización</th><th>Scoring</th><th>Esfuerzo</th><th>Orden</th><th>Prioridad</th><th class="status-column">Estado</th><th class="pr-column">PR</th></tr>`;
}

function row(task, { readonly, mode, compact }) {
  const background = task.task_status === "To do" ? TASK_COLORS["To do"][task.priority] : TASK_COLORS[task.task_status];
  const border = task.task_status === "Done" ? PR_BORDER_COLORS[task.pr_status] : null;
  const visualStyle = `--task-bg:${background}; --task-border:${border || "transparent"};`;
  const colspan = mode === "backlog" ? 7 : mode === "daily" ? 8 : 11;
  const clickableAttrs = compact ? `data-view-task="${task.id}"` : "";
  return `
    <tr class="task-main-row ${compact ? "clickable-row" : ""}" ${clickableAttrs} style="${visualStyle}">
      <td>${ticketCell(task.ticket)}</td>
      <td>${escapeHtml(task.ticket_type || "Bug")}</td>
      <td>${escapeHtml(task.assigned_date)}</td>
      <td>${escapeHtml(task.limit_date || "-")}</td>
      ${mode === "full" ? `<td>${escapeHtml(task.finished_date || "-")}</td>` : ""}
      <td>${escapeHtml(task.scoring ?? "-")}</td>
      ${mode !== "full" ? `<td>${escapeHtml(task.order_points ?? "-")}</td>` : ""}
      ${mode === "full" ? `
        <td>${escapeHtml(task.effort_points)}</td>
        <td>${escapeHtml(task.order_points ?? "-")}</td>
        <td>${escapeHtml(task.priority)}</td>
        <td class="status-cell">${statusSelect(task, readonly)}</td>
        <td class="pr-cell">${prSelect(task, readonly)}</td>
      ` : ""}
      ${mode === "daily" ? `<td class="status-cell">${statusSelect(task, readonly)}</td><td class="pr-cell">${prSelect(task, readonly)}</td>` : ""}
      ${mode === "backlog" ? `<td class="actions-cell">${taskActions(task, readonly)}</td>` : ""}
    </tr>
    <tr class="task-title-row ${compact ? "clickable-row" : ""}" ${clickableAttrs} style="${visualStyle}">
      <td class="task-title-cell" colspan="${colspan}">
        <div>${escapeHtml(task.title)}</div>
        ${task.more_info ? `<div class="task-more-info">${escapeHtml(task.more_info)}</div>` : ""}
      </td>
    </tr>
  `;
}

function taskActions(task, readonly) {
  return `
    <div class="task-actions">
      <button class="icon-button edit-icon-button" data-edit-task="${task.id}" ${readonly ? "disabled" : ""} aria-label="Editar tarea">${editIcon()}</button>
      <button class="icon-button edit-icon-button" data-clone-task="${task.id}" ${readonly ? "disabled" : ""} aria-label="Clonar tarea">${cloneIcon()}</button>
    </div>
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
  const statuses = task.ticket_type === "Task" ? TASK_PR_STATUSES : PR_STATUSES;
  return `<select data-pr-status="${task.id}" ${disabled ? "disabled" : ""}>${statuses.map((status) => `<option ${task.pr_status === status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}

function prStatusOptions(task) {
  const statuses = task?.ticket_type === "Task" ? TASK_PR_STATUSES : PR_STATUSES;
  const selectedStatus = statuses.includes(task?.pr_status) ? task?.pr_status : statuses[0];
  return statuses.map((status) => `<option ${(selectedStatus === status) ? "selected" : ""}>${status}</option>`).join("");
}

function editIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"></path>
      <path d="m14 8 2 2"></path>
    </svg>
  `;
}
function cloneIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="8" y="8" width="11" height="11" rx="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"></path>
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
          ${detailItem("Tipo", escapeHtml(task.ticket_type || "Bug"))}
          ${detailItem("Scoring", escapeHtml(task.scoring ?? "-"))}
          ${detailItem("Título", escapeHtml(task.title), "span-3 detail-title")}
          ${detailItem("Fecha asignación", escapeHtml(task.assigned_date))}
          ${detailItem("Fecha límite", escapeHtml(task.limit_date || "-"))}
          ${detailItem("Fecha finalización", escapeHtml(task.finished_date || "-"))}
          ${detailItem("Esfuerzo", escapeHtml(task.effort_points))}
          ${detailItem("Orden", escapeHtml(task.order_points ?? "-"))}
          ${detailItem("Prioridad", escapeHtml(task.priority))}
          ${detailItem("Estado", statusSelect(task, readonly))}
          ${detailItem("PR", prSelect(task, readonly))}
          ${detailItem("Más info", escapeHtml(task.more_info || "-"), "span-3 detail-info")}
        </div>
        ${TaskComments(task, { readonly })}
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

function TaskComments(task, { readonly = false } = {}) {
  const comments = Array.isArray(task.comments) ? task.comments : [];
  return `
    <section class="task-comments">
      <div class="task-comments-header">
        <h3>Comentarios</h3>
        <span>${comments.length}</span>
      </div>
      <div class="task-comments-list">
        ${comments.length ? comments.map(commentItem).join("") : `<p class="task-comment-empty">Sin comentarios todavía.</p>`}
      </div>
      ${readonly ? "" : `
        <form class="task-comment-form" data-task-comment-form="${task.id}">
          <label>Nuevo comentario<textarea name="comment" required placeholder="Añade un comentario a la tarea"></textarea></label>
          <div class="modal-actions">
            <button type="submit" class="primary">Añadir comentario</button>
          </div>
        </form>
      `}
    </section>
  `;
}

function commentItem(comment) {
  const text = typeof comment === "string" ? comment : comment?.text;
  const createdAt = typeof comment === "object" ? comment?.created_at : null;
  return `
    <article class="task-comment">
      <p>${escapeHtml(text || "")}</p>
      ${createdAt ? `<time>${escapeHtml(formatCommentDate(createdAt))}</time>` : ""}
    </article>
  `;
}

function formatCommentDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function TaskModal(task = null) {
  const isEdit = Boolean(task?.id);
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div class="modal-header">
          <h2 id="task-modal-title">${isEdit ? "Editar tarea" : "Crear tarea"}</h2>
          <button class="icon-button" data-close-modal aria-label="Cerrar">X</button>
        </div>
        <form id="task-form" class="form-grid task-form-grid">
          <input type="hidden" name="id" value="${escapeHtml(task?.id || "")}" />
          <label>Ticket<input name="ticket" value="${escapeHtml(task?.ticket || "")}" /></label>
          <label>Tipo<select name="ticket_type">${TICKET_TYPES.map((type) => `<option ${((task?.ticket_type || "Bug") === type) ? "selected" : ""}>${type}</option>`).join("")}</select></label>
          <label>Prioridad<select name="priority">${PRIORITIES.map((priority) => `<option ${((task?.priority || "Menor") === priority) ? "selected" : ""}>${priority}</option>`).join("")}</select></label>
          <label class="span-3">Titulo<input name="title" required value="${escapeHtml(task?.title || "")}" /></label>
          <label>Fecha asignación<input name="assigned_date" type="date" required value="${escapeHtml(task?.assigned_date || new Date().toISOString().slice(0, 10))}" /></label>
          <label>Fecha límite<input name="limit_date" type="date" value="${escapeHtml(task?.limit_date || "")}" /></label>
          <label>Fecha finalización<input name="finished_date" type="date" value="${escapeHtml(task?.finished_date || "")}" ${!isEdit || task?.task_status !== "Done" ? "disabled" : ""} /></label>
          <label>Punto de esfuerzo<input name="effort_points" type="number" min="0" value="${escapeHtml(task?.effort_points ?? 3)}" /></label>
          <label>Punto de orden<input name="order_points" type="number" value="${escapeHtml(task?.order_points ?? "")}" /></label>
          ${isEdit ? `<label>Estado tarea<select name="task_status">${TASK_STATUSES.map((status) => `<option ${(task?.task_status === status) ? "selected" : ""}>${status}</option>`).join("")}</select></label>` : ""}
          ${isEdit ? `<label>Estado PR<select name="pr_status" ${task?.task_status !== "Done" ? "disabled" : ""}>${prStatusOptions(task)}</select></label>` : ""}
          <label class="span-3">Más info<textarea name="more_info">${escapeHtml(task?.more_info || "")}</textarea></label>
          <div class="modal-actions span-3">
            <button type="button" class="secondary" data-close-modal>Cancelar</button>
            <button type="submit" class="primary">Guardar</button>
          </div>
        </form>
      </section>
    </div>
  `;
}



