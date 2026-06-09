import { ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { escapeHtml } from "../utils/format.js";

export function OrderTasksPage({ tasks = [], loading = false, error = "", success = "" } = {}) {
  return `
    <section class="page-header order-page-header">
      <div>
        <p class="eyebrow">Orden manual</p>
        <h1>Ordenar tareas</h1>
        <p class="page-description">Solo aparecen tareas pendientes con puntos de orden. Arrastra una fila para moverla varias posiciones o usa los botones como alternativa.</p>
      </div>
      <button class="secondary" data-order-normalize ${tasks.length ? "" : "disabled"}>Ordenar automáticamente</button>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="panel order-panel">
      ${loading ? LoadingState() : orderTaskList(tasks)}
    </section>
  `;
}

function orderTaskList(tasks) {
  if (!tasks.length) return `<div class="state empty">No hay tareas ordenables.</div>`;

  return `
    <div class="table-wrap">
      <table class="order-task-table">
        <thead>
          <tr>
            <th>Posición</th>
            <th>Ticket</th>
            <th>Tarea</th>
            <th>Tipo</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Asignación</th>
            <th>Límite</th>
            <th>Orden</th>
            <th class="actions-column">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(orderTaskRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function orderTaskRow(task, index, tasks) {
  return `
    <tr class="order-task-row" draggable="true" data-order-row data-order-index="${index}">
      <td class="position-cell"><span class="drag-handle" aria-hidden="true">::</span>${index + 1}</td>
      <td>${ticketCell(task.ticket)}</td>
      <td class="order-title-cell">${escapeHtml(task.title)}</td>
      <td>${escapeHtml(task.ticket_type || "Bug")}</td>
      <td>${escapeHtml(task.priority)}</td>
      <td>${escapeHtml(task.task_status)}</td>
      <td>${escapeHtml(task.assigned_date || "-")}</td>
      <td>${escapeHtml(task.limit_date || "-")}</td>
      <td class="points-cell">${escapeHtml(task.order_points)}</td>
      <td class="actions-cell">
        <div class="task-actions">
          <button class="icon-button order-move-button" data-order-move="up" data-order-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="Mover arriba">${arrowUpIcon()}</button>
          <button class="icon-button order-move-button" data-order-move="down" data-order-index="${index}" ${index === tasks.length - 1 ? "disabled" : ""} aria-label="Mover abajo">${arrowDownIcon()}</button>
        </div>
      </td>
    </tr>
  `;
}

function ticketCell(ticket) {
  if (!ticket) return "-";
  const safeTicket = escapeHtml(ticket);
  return `<a href="https://jira.knowmadmood.com/browse/${encodeURIComponent(ticket)}" target="_blank" rel="noreferrer">${safeTicket}</a>`;
}

function arrowUpIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 19V5"></path>
      <path d="m6 11 6-6 6 6"></path>
    </svg>
  `;
}

function arrowDownIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 5v14"></path>
      <path d="m18 13-6 6-6-6"></path>
    </svg>
  `;
}
