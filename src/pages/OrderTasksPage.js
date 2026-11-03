import { PageHeader } from "../components/PageHeader.js";
import { EmptyState, LoadingState } from "../components/StateMessages.js";
import { TypeBadge } from "../components/TaskTable.js";
import { escapeHtml } from "../utils/format.js";
import { ticketLinkHtml } from "../utils/projectSettings.js";

export function OrderTasksPage({ tasks = [], loading = false } = {}) {
  return `
    ${PageHeader({
      eyebrow: "Tareas",
      title: "Ordenar tareas",
      description: "Solo aparecen tareas pendientes con puntos de orden. Arrastra una fila para moverla varias posiciones o usa las flechas.",
      actions: `<button class="secondary" data-order-normalize ${tasks.length ? "" : "disabled"}>Ordenar automáticamente</button>`,
    })}
    <section class="panel order-panel">
      ${loading ? LoadingState() : orderTaskList(tasks)}
    </section>
  `;
}

function orderTaskList(tasks) {
  if (!tasks.length) return EmptyState("No hay tareas ordenables.");

  return `
    <div class="table-wrap">
      <table class="data-table order-task-table">
        <thead>
          <tr>
            <th class="position-cell">Posición</th>
            <th>Tarea</th>
            <th>Tipo</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Asignación</th>
            <th>Límite</th>
            <th class="cell-number">Orden</th>
            <th class="actions-cell"><span class="visually-hidden">Mover</span></th>
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
      <td class="position-cell"><span class="drag-handle" aria-hidden="true">${gripIcon()}</span>${index + 1}</td>
      <td class="order-title-cell">
        ${task.ticket ? `<span class="task-ticket">${ticketLinkHtml(task.ticket)}</span>` : ""}
        <span class="task-title">${escapeHtml(task.title)}</span>
      </td>
      <td>${TypeBadge(task.ticket_type)}</td>
      <td>${escapeHtml(task.priority)}</td>
      <td>${escapeHtml(task.task_status)}</td>
      <td class="cell-date">${escapeHtml(task.assigned_date || "-")}</td>
      <td class="cell-date">${escapeHtml(task.limit_date || "-")}</td>
      <td class="cell-number points-cell">${escapeHtml(task.order_points)}</td>
      <td class="actions-cell">
        <div class="task-actions">
          <button class="icon-button order-move-button" data-order-move="up" data-order-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="Mover arriba" title="Mover arriba">${arrowUpIcon()}</button>
          <button class="icon-button order-move-button" data-order-move="down" data-order-index="${index}" ${index === tasks.length - 1 ? "disabled" : ""} aria-label="Mover abajo" title="Mover abajo">${arrowDownIcon()}</button>
        </div>
      </td>
    </tr>
  `;
}

function gripIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1"></circle><circle cx="15" cy="6" r="1"></circle>
      <circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle>
      <circle cx="9" cy="18" r="1"></circle><circle cx="15" cy="18" r="1"></circle>
    </svg>
  `;
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
