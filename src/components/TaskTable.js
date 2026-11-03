import { DAILY_TICKET_TYPE, PRIORITIES, PR_BORDER_COLORS, PR_STATUSES, TASK_COLORS, TASK_PR_STATUSES, TASK_STATUSES, TICKET_TYPES } from "../utils/constants.js";
import { escapeHtml } from "../utils/format.js";
import { ticketLinkHtml } from "../utils/projectSettings.js";
import { EmptyState } from "./StateMessages.js";

// Columns after the main one (ticket + title). `cell` renders the content, `className` aligns it.
const TABLE_COLUMNS = {
  backlog: [
    { label: "Tipo", cell: (task) => TypeBadge(task.ticket_type) },
    { label: "Asignación", cell: (task) => dateValue(task.assigned_date), className: "cell-date" },
    { label: "Límite", cell: (task) => dateValue(task.limit_date), className: "cell-date" },
    { label: "Finalización", cell: (task) => dateValue(task.finished_date), className: "cell-date" },
    { label: "Scoring", cell: (task) => plainValue(task.scoring), className: "cell-number" },
    { label: "Orden", cell: (task) => plainValue(task.order_points), className: "cell-number" },
    { label: "Acciones", cell: (task, { readonly }) => taskActions(task, readonly), className: "actions-cell", hideLabel: true },
  ],
  daily: [
    { label: "Tipo", cell: (task) => TypeBadge(task.ticket_type) },
    { label: "Asignación", cell: (task) => dateValue(task.assigned_date), className: "cell-date" },
    { label: "Límite", cell: (task) => dateValue(task.limit_date), className: "cell-date" },
    { label: "Scoring", cell: (task) => plainValue(task.scoring), className: "cell-number" },
    { label: "Orden", cell: (task) => plainValue(task.order_points), className: "cell-number" },
    { label: "Estado", cell: (task, { readonly }) => statusSelect(task, readonly), className: "status-cell" },
    { label: "PR", cell: (task, { readonly }) => prSelect(task, readonly), className: "pr-cell" },
    { label: "Backlog", cell: (task) => (task.__pending ? "" : BacklogTaskButton(task.id)), className: "backlog-link-cell", hideLabel: true },
  ],
};

const TYPE_CLASSES = { Bug: "type-bug", Feature: "type-feature", Task: "type-task", [DAILY_TICKET_TYPE]: "type-daily" };

export function TaskTable(tasks, { readonly = false, mode = "backlog" } = {}) {
  if (!tasks.length) return EmptyState("No hay tareas para mostrar.");
  const columns = TABLE_COLUMNS[mode] ?? TABLE_COLUMNS.backlog;
  return `
    <div class="table-wrap">
      <table class="task-table task-table-${mode}">
        <thead>
          <tr>
            <th class="task-col-main">Tarea</th>
            ${columns.map((column) => `<th class="${column.className ?? ""}">${column.hideLabel ? `<span class="visually-hidden">${column.label}</span>` : column.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${tasks.map((task) => row(task, columns, { readonly })).join("")}</tbody>
      </table>
    </div>
  `;
}

function row(task, columns, { readonly }) {
  const pending = Boolean(task.__pending);
  const options = { readonly: readonly || pending };
  return `
    <tr class="task-row ${pending ? "task-pending-row" : "clickable-row"}" ${pending ? "" : `data-view-task="${escapeHtml(task.id)}" tabindex="0"`} style="${taskColorVars(task)}">
      <td class="task-cell-main">${TaskSummary(task)}</td>
      ${columns.map((column) => `<td class="${column.className ?? ""}" ${column.hideLabel ? "" : `data-label="${column.label}"`}>${column.cell(task, options)}</td>`).join("")}
    </tr>
  `;
}

// Ticket, title, comment count and extra info: the block that identifies a task in every list.
export function TaskSummary(task, { showMoreInfo = true } = {}) {
  return `
    <div class="task-summary">
      ${task.ticket || getCommentCount(task) || task.__pending ? `
        <div class="task-summary-meta">
          ${task.ticket ? `<span class="task-ticket">${ticketLinkHtml(task.ticket)}</span>` : ""}
          ${commentCountBadge(task)}
          ${pendingBadge(task)}
        </div>
      ` : ""}
      <p class="task-title">${escapeHtml(task.title || "Sin título")}</p>
      ${showMoreInfo && task.more_info ? `<p class="task-more-info">${escapeHtml(task.more_info)}</p>` : ""}
    </div>
  `;
}

// Background follows the task status (and priority for To do); the left accent follows the PR status once Done.
export function taskColorVars(task) {
  const background = task.task_status === "To do" ? TASK_COLORS["To do"][task.priority] : TASK_COLORS[task.task_status];
  const border = task.task_status === "Done" ? PR_BORDER_COLORS[task.pr_status] : null;
  return `--task-bg:${background || "var(--surface)"}; --task-border:${border || "transparent"};`;
}

export function TypeBadge(type) {
  const value = type || "Bug";
  return `<span class="type-badge ${TYPE_CLASSES[value] ?? ""}">${escapeHtml(value)}</span>`;
}

function dateValue(value) {
  return value ? `<span class="nowrap">${escapeHtml(value)}</span>` : emptyValue();
}

function plainValue(value) {
  return value === null || value === undefined || value === "" ? emptyValue() : escapeHtml(value);
}

function emptyValue() {
  return `<span class="cell-empty" aria-label="Sin valor">—</span>`;
}

function taskActions(task, readonly) {
  return `
    <div class="task-actions">
      <button type="button" class="icon-button edit-icon-button" data-edit-task="${escapeHtml(task.id)}" ${readonly ? "disabled" : ""} aria-label="Editar tarea" title="Editar">${editIcon()}</button>
      <button type="button" class="icon-button edit-icon-button" data-clone-task="${escapeHtml(task.id)}" ${readonly ? "disabled" : ""} aria-label="Clonar tarea" title="Clonar">${cloneIcon()}</button>
    </div>
  `;
}

function pendingBadge(task) {
  if (!task.__pending) return "";
  const label = task.__pendingLabel || "Guardando...";
  return `<span class="task-pending-badge" title="Valores provisionales en solo lectura hasta recibir la respuesta del servidor."><span class="spinner spinner-sm" aria-hidden="true"></span>${escapeHtml(label)}</span>`;
}

function getCommentCount(task) {
  return Array.isArray(task.comments) ? task.comments.length : 0;
}

function commentCountBadge(task) {
  const count = getCommentCount(task);
  if (!count) return "";
  const label = `${count} ${count === 1 ? "comentario" : "comentarios"}`;
  return `<span class="task-comment-count" title="${label}" aria-label="${label}">${commentIcon()}${count}</span>`;
}

function commentIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5a9 9 0 0 1-4-1L3 20l1-4.5a8.38 8.38 0 0 1-1-4A8.38 8.38 0 0 1 11.5 3A8.38 8.38 0 0 1 21 11.5Z"></path>
    </svg>
  `;
}

export function BacklogTaskButton(taskId) {
  return `
    <button class="icon-button task-backlog-button" data-go-backlog-task="${escapeHtml(taskId)}" type="button" aria-label="Gestionar tarea en Backlog" title="Ver en Backlog">
      ${arrowRightIcon()}
    </button>
  `;
}

function ticketCell(ticket) {
  return ticketLinkHtml(ticket);
}

function statusSelect(task, readonly) {
  return `<select data-task-status="${task.id}" aria-label="Estado de la tarea" ${readonly ? "disabled" : ""}>${TASK_STATUSES.map((status) => `<option ${task.task_status === status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}

function prSelect(task, readonly) {
  const disabled = readonly || task.task_status !== "Done";
  const statuses = task.ticket_type === "Task" ? TASK_PR_STATUSES : PR_STATUSES;
  return `<select data-pr-status="${task.id}" aria-label="Estado del PR" ${disabled ? "disabled" : ""}>${statuses.map((status) => `<option ${task.pr_status === status ? "selected" : ""}>${status}</option>`).join("")}</select>`;
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

export function closeIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 6l12 12"></path>
      <path d="M18 6 6 18"></path>
    </svg>
  `;
}

function arrowRightIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14"></path>
      <path d="m13 6 6 6-6 6"></path>
    </svg>
  `;
}
export function TaskDetailModal(task, { readonly = false } = {}) {
  if (!task) return "";
  const pending = Boolean(task.__pending);
  const isReadonly = readonly || pending;
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal task-detail-modal" role="dialog" aria-modal="true" aria-labelledby="task-detail-title" tabindex="-1">
        <div class="modal-header">
          <div class="modal-heading">
            <p class="eyebrow">Detalle de tarea${task.ticket ? ` · ${escapeHtml(task.ticket)}` : ""}</p>
            <h2 id="task-detail-title">${escapeHtml(task.title)}</h2>
          </div>
          <div class="modal-header-actions">
            ${isReadonly ? "" : `<button class="primary detail-edit-button" data-edit-detail-task="${escapeHtml(task.id)}">${editIcon()}Editar</button>`}
            <button class="icon-button close-icon-button" data-close-detail-modal aria-label="Cerrar" title="Cerrar (Esc)">${closeIcon()}</button>
          </div>
        </div>
        ${pending ? `<div class="state warning detail-pending">Cambios provisionales en solo lectura hasta que el servidor confirme.</div>` : ""}
        <div class="detail-grid">
          ${detailItem("Ticket", task.ticket ? ticketCell(task.ticket) : "-")}
          ${detailItem("Tipo", TypeBadge(task.ticket_type))}
          ${detailItem("Prioridad", escapeHtml(task.priority))}
          ${detailItem("Estado", statusSelect(task, isReadonly))}
          ${detailItem("PR", prSelect(task, isReadonly))}
          ${detailItem("Scoring", escapeHtml(task.scoring ?? "-"))}
          ${detailItem("Fecha asignación", escapeHtml(task.assigned_date))}
          ${detailItem("Fecha límite", escapeHtml(task.limit_date || "-"))}
          ${detailItem("Fecha finalización", escapeHtml(task.finished_date || "-"))}
          ${detailItem("Esfuerzo", escapeHtml(task.effort_points))}
          ${detailItem("Orden", escapeHtml(task.order_points ?? "-"))}
          ${task.imputed_date ? detailItem("Fecha imputación", escapeHtml(task.imputed_date)) : ""}
          ${task.pr_link ? detailItem("Link PR", externalLink(task.pr_link, "Abrir PR")) : ""}
          ${task.test_cases ? detailItem("Test Cases", externalLink(task.test_cases, "Abrir Test Cases")) : ""}
          ${detailItem("Más info", escapeHtml(task.more_info || "-"), "span-3 detail-info")}
        </div>
        ${TaskComments(task, { readonly: isReadonly })}
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

function externalLink(value, label) {
  const url = String(value ?? "").trim();
  if (!url) return "-";
  if (!/^https?:\/\//i.test(url)) return escapeHtml(url);
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}
function TaskComments(task, { readonly = false } = {}) {
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const orderedComments = comments.slice().reverse();
  return `
    <section class="task-comments">
      <div class="task-comments-header">
        <h3>Comentarios</h3>
        <span class="count-badge">${comments.length}</span>
      </div>
      <div class="task-comments-list">
        ${orderedComments.length ? orderedComments.map(commentItem).join("") : `<p class="task-comment-empty">Sin comentarios todavía.</p>`}
      </div>
      ${readonly ? "" : `
        <form class="task-comment-form" data-task-comment-form="${task.id}">
          <label>Nuevo comentario<textarea name="comment" required placeholder="Añade un comentario a la tarea"></textarea></label>
          <div class="modal-actions">
            <button type="submit" class="secondary">Añadir comentario</button>
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
  if (task?.ticket_type === DAILY_TICKET_TYPE) return DailyTaskModal(task, isEdit);
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal task-form-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" tabindex="-1">
        <div class="modal-header">
          <div class="modal-heading">
            <p class="eyebrow">Tareas</p>
            <h2 id="task-modal-title">${isEdit ? "Editar tarea" : "Crear tarea"}</h2>
          </div>
          <button class="icon-button close-icon-button" data-close-modal aria-label="Cerrar" title="Cerrar (Esc)">${closeIcon()}</button>
        </div>
        <form id="task-form" class="form-grid task-form-grid">
          <input type="hidden" name="id" value="${escapeHtml(task?.id || "")}" />
          <label class="span-3">Título<input name="title" required autofocus value="${escapeHtml(task?.title || "")}" /></label>
          <label>Ticket<input name="ticket" value="${escapeHtml(task?.ticket || "")}" /></label>
          <label>Tipo<select name="ticket_type">${TICKET_TYPES.map((type) => `<option ${((task?.ticket_type || "Bug") === type) ? "selected" : ""}>${type}</option>`).join("")}</select></label>
          <label>Prioridad<select name="priority">${PRIORITIES.map((priority) => `<option ${((task?.priority || "Menor") === priority) ? "selected" : ""}>${priority}</option>`).join("")}</select></label>
          <label>Fecha asignación<input name="assigned_date" type="date" required value="${escapeHtml(task?.assigned_date || new Date().toISOString().slice(0, 10))}" /></label>
          <label>Fecha límite<input name="limit_date" type="date" value="${escapeHtml(task?.limit_date || "")}" /></label>
          <label>Fecha finalización<input name="finished_date" type="date" value="${escapeHtml(task?.finished_date || "")}" ${!isEdit || task?.task_status !== "Done" ? "disabled" : ""} /></label>
          <label>Puntos de esfuerzo<input name="effort_points" type="number" min="0" value="${escapeHtml(task?.effort_points ?? 3)}" /></label>
          <label>Puntos de orden<input name="order_points" type="number" value="${escapeHtml(task?.order_points ?? "")}" /></label>
          ${isEdit ? `<label>Estado tarea<select name="task_status">${TASK_STATUSES.map((status) => `<option ${(task?.task_status === status) ? "selected" : ""}>${status}</option>`).join("")}</select></label>` : ""}
          ${isEdit ? `<label>Estado PR<select name="pr_status" ${task?.task_status !== "Done" ? "disabled" : ""}>${prStatusOptions(task)}</select></label>` : ""}
          <label class="span-3">Más info<textarea name="more_info">${escapeHtml(task?.more_info || "")}</textarea></label>
          ${isEdit ? `
            <div class="task-delete-zone span-3">
              <p class="task-delete-warning">Eliminar la tarea es permanente: esta acción no se puede deshacer.</p>
              <button type="button" class="secondary danger-button" data-delete-task="${escapeHtml(task.id)}">Eliminar tarea</button>
            </div>
          ` : ""}
          <div class="modal-actions span-3">
            <button type="button" class="secondary" data-close-modal>Cancelar</button>
            <button type="submit" class="primary">Guardar</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

// Daily tasks share the task form handlers but hide effort points, order points, priority and PR status.
function DailyTaskModal(task, isEdit) {
  const status = task?.task_status === "Done" ? "Done" : "To do";
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal task-form-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" tabindex="-1">
        <div class="modal-header">
          <div class="modal-heading">
            <p class="eyebrow">Tareas diarias</p>
            <h2 id="task-modal-title">${isEdit ? "Editar tarea diaria" : "Crear tarea diaria"}</h2>
          </div>
          <button class="icon-button close-icon-button" data-close-modal aria-label="Cerrar" title="Cerrar (Esc)">${closeIcon()}</button>
        </div>
        <p class="daily-task-modal-hint">Se añade obligatoriamente a cada parte diario mientras no tenga fecha de finalización. No usa puntos de esfuerzo ni de orden.</p>
        <form id="task-form" class="form-grid task-form-grid">
          <input type="hidden" name="id" value="${escapeHtml(task?.id || "")}" />
          <input type="hidden" name="ticket_type" value="${DAILY_TICKET_TYPE}" />
          <label class="span-3">Título<input name="title" required autofocus value="${escapeHtml(task?.title || "")}" /></label>
          <label>Ticket<input name="ticket" value="${escapeHtml(task?.ticket || "")}" /></label>
          <label>Fecha inicio<input name="assigned_date" type="date" required value="${escapeHtml(task?.assigned_date || new Date().toISOString().slice(0, 10))}" /></label>
          ${isEdit ? `
            <label>Estado<select name="task_status">
              <option value="To do" ${status === "To do" ? "selected" : ""}>Activa</option>
              <option value="Done" ${status === "Done" ? "selected" : ""}>Finalizada</option>
            </select></label>
          ` : ""}
          <label class="span-3">Más info<textarea name="more_info">${escapeHtml(task?.more_info || "")}</textarea></label>
          ${isEdit ? `
            <div class="task-delete-zone span-3">
              <p class="task-delete-warning">Eliminar la tarea diaria es permanente y borra su historial de partes diarios.</p>
              <button type="button" class="secondary danger-button" data-delete-task="${escapeHtml(task.id)}">Eliminar tarea</button>
            </div>
          ` : ""}
          <div class="modal-actions span-3">
            <button type="button" class="secondary" data-close-modal>Cancelar</button>
            <button type="submit" class="primary">Guardar</button>
          </div>
        </form>
      </section>
    </div>
  `;
}
