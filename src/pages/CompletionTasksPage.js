import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { escapeHtml, todayIso } from "../utils/format.js";
import { formatHoursFromEffortPoints } from "../utils/effortTime.js";

export function CompletionTasksPage({ tasks = [], minutesPerEffortPoint = 60, loading = false, error = "", success = "", modalTask = null } = {}) {
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Completar tareas</p>
        <h1>Cierre de workflow</h1>
      </div>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="panel">
      ${loading ? LoadingState() : CompletionTasksTable(tasks, minutesPerEffortPoint)}
    </section>
    ${modalTask ? CompletionResolveModal(modalTask, minutesPerEffortPoint) : ""}
  `;
}

function CompletionTasksTable(tasks, minutesPerEffortPoint) {
  if (!tasks.length) return EmptyState("No hay tareas pendientes de completar.");

  return `
    <div class="table-wrap">
      <table class="completion-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Tipo</th>
            <th>Título</th>
            <th>Finalización</th>
            <th>Horas</th>
            <th>PR</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map((task) => CompletionTaskRow(task, minutesPerEffortPoint)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function CompletionTaskRow(task, minutesPerEffortPoint) {
  return `
    <tr>
      <td>${ticketCell(task.ticket)}</td>
      <td>${escapeHtml(task.ticket_type || "Bug")}</td>
      <td><strong>${escapeHtml(task.title || "Sin título")}</strong></td>
      <td>${escapeHtml(task.finished_date || "-")}</td>
      <td>${escapeHtml(formatHoursFromEffortPoints(task.effort_points, minutesPerEffortPoint))}</td>
      <td><span class="status-pill">${escapeHtml(task.pr_status || "-")}</span></td>
      <td>${resolveButton(task)}</td>
    </tr>
  `;
}

function resolveButton(task) {
  if (!canResolve(task)) {
    return `<button class="secondary" type="button" disabled>Resolver</button>`;
  }
  return `<button class="primary" type="button" data-open-completion-resolve="${escapeHtml(task.id)}">Resolver</button>`;
}

function canResolve(task) {
  if (task.pr_status === "Need PR") return task.ticket_type !== "Task";
  if (task.pr_status === "PR Hecho") return true;
  if (task.pr_status === "Imputed") return task.ticket_type !== "Task";
  return false;
}

function CompletionResolveModal(task, minutesPerEffortPoint) {
  const title = {
    "Need PR": "Informar PR",
    "PR Hecho": "Imputar horas",
    Imputed: "Cerrar tarea",
  }[task.pr_status] ?? "Resolver tarea";

  return `
    <div class="modal-backdrop">
      <section class="modal completion-modal" role="dialog" aria-modal="true" aria-labelledby="completion-modal-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Completar tareas</p>
            <h2 id="completion-modal-title">${escapeHtml(title)}</h2>
          </div>
          <button class="icon-button" data-close-completion-modal aria-label="Cerrar">x</button>
        </div>
        ${CompletionResolveForm(task, minutesPerEffortPoint)}
      </section>
    </div>
  `;
}

function CompletionResolveForm(task, minutesPerEffortPoint) {
  if (task.pr_status === "Need PR") return NeedPrForm(task);
  if (task.pr_status === "PR Hecho") return PrDoneForm(task, minutesPerEffortPoint);
  if (task.pr_status === "Imputed") return ImputedForm(task);
  return `<p class="state warning">Esta tarea no tiene una transición de resolución disponible.</p>`;
}

function NeedPrForm(task) {
  return `
    <form id="completion-resolve-form" class="completion-resolve-form" data-completion-status="Need PR">
      <input type="hidden" name="id" value="${escapeHtml(task.id)}" />
      <label>Link al PR
        <input name="pr_link" type="url" placeholder="https://..." value="${escapeHtml(task.pr_link || "")}" />
      </label>
      ${task.ticket_type === "Feature" ? `
        <label>Test cases
          <textarea name="test_cases" placeholder="Casos de prueba ejecutados o referencia">${escapeHtml(task.test_cases || "")}</textarea>
        </label>
      ` : ""}
      <div class="modal-actions">
        <button class="secondary" type="button" data-close-completion-modal>Cancelar</button>
        <button class="primary" type="submit">Confirmar</button>
      </div>
    </form>
  `;
}

function PrDoneForm(task, minutesPerEffortPoint) {
  const imputedDate = task.imputed_date || task.finished_date || todayIso();
  return `
    <form id="completion-resolve-form" class="completion-resolve-form" data-completion-status="PR Hecho">
      <input type="hidden" name="id" value="${escapeHtml(task.id)}" />
      <div class="completion-summary">
        <p><span>Ticket</span>${ticketCell(task.ticket)}</p>
        <p><span>Título</span><strong>${escapeHtml(task.title || "Sin título")}</strong></p>
        <p><span>Fecha de resolución</span><strong>${escapeHtml(task.finished_date || "-")}</strong></p>
        <p><span>Horas a imputar</span><strong>${escapeHtml(formatHoursFromEffortPoints(task.effort_points, minutesPerEffortPoint))}</strong></p>
      </div>
      <label>Fecha de imputación
        <input name="imputed_date" type="date" value="${escapeHtml(imputedDate)}" required />
      </label>
      <div class="modal-actions">
        <button class="secondary" type="button" data-close-completion-modal>Cancelar</button>
        <button class="primary" type="submit">Confirmar</button>
      </div>
    </form>
  `;
}

function ImputedForm(task) {
  return `
    <form id="completion-resolve-form" class="completion-resolve-form" data-completion-status="Imputed">
      <input type="hidden" name="id" value="${escapeHtml(task.id)}" />
      <div class="completion-summary">
        <p><span>Ticket</span>${ticketCell(task.ticket)}</p>
      </div>
      <p class="state warning">Cierra la tarea en el sistema externo antes de confirmar este paso.</p>
      <div class="modal-actions">
        <button class="secondary" type="button" data-close-completion-modal>Cancelar</button>
        <button class="primary" type="submit">Confirmar cierre</button>
      </div>
    </form>
  `;
}

function ticketCell(ticket) {
  const value = String(ticket ?? "").trim();
  if (!value) return "-";
  if (/^https?:\/\//i.test(value)) {
    return `<a href="${escapeHtml(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`;
  }
  return `<a href="https://jira.knowmadmood.com/browse/${encodeURIComponent(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`;
}
