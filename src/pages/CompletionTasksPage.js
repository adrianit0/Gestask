import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { TaskDetailModal } from "../components/TaskTable.js";
import { PR_BORDER_COLORS } from "../utils/constants.js";
import { escapeHtml, todayIso } from "../utils/format.js";
import { formatHoursFromEffortPoints } from "../utils/effortTime.js";

export function CompletionTasksPage({ tasks = [], minutesPerEffortPoint = 60, loading = false, error = "", success = "", modalTask = null, detailTask = null } = {}) {
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
    ${detailTask ? TaskDetailModal(detailTask, { readonly: true }) : ""}
  `;
}

function CompletionTasksTable(tasks, minutesPerEffortPoint) {
  if (!tasks.length) return EmptyState("No hay tareas pendientes de completar.");
  const sortedTasks = sortCompletionTasks(tasks);

  return `
    <div class="table-wrap">
      <table class="task-table task-table-completion">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Tipo</th>
            <th>Finalización</th>
            <th>Horas</th>
            <th>PR</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${sortedTasks.map((task) => CompletionTaskRow(task, minutesPerEffortPoint)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function sortCompletionTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const statusCompared = getPrStatusOrder(a.pr_status) - getPrStatusOrder(b.pr_status);
    if (statusCompared !== 0) return statusCompared;

    const finishedCompared = compareDatesAsc(a.finished_date, b.finished_date);
    if (finishedCompared !== 0) return finishedCompared;

    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
}

function getPrStatusOrder(status) {
  const order = {
    "Need PR": 0,
    "Need to Impute": 1,
    Imputed: 2,
    Deployed: 3,
  };
  return order[status] ?? 99;
}

function compareDatesAsc(a, b) {
  const aMissing = !a;
  const bMissing = !b;
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return new Date(String(a)).getTime() - new Date(String(b)).getTime();
}

function CompletionTaskRow(task, minutesPerEffortPoint) {
  const visualStyle = `--task-bg:#ccffcc; --task-border:${PR_BORDER_COLORS[task.pr_status] || "transparent"};`;
  const clickableAttrs = `data-view-task="${escapeHtml(task.id)}"`;
  return `
    <tr class="task-main-row clickable-row" ${clickableAttrs} style="${visualStyle}">
      <td>${ticketCell(task.ticket)}</td>
      <td>${escapeHtml(task.ticket_type || "Bug")}</td>
      <td>${escapeHtml(task.finished_date || "-")}</td>
      <td>${escapeHtml(formatHoursFromEffortPoints(task.effort_points, minutesPerEffortPoint))}</td>
      <td><span class="status-pill">${escapeHtml(task.pr_status || "-")}</span></td>
      <td>${resolveButton(task)}</td>
    </tr>
    <tr class="task-title-row clickable-row" ${clickableAttrs} style="${visualStyle}">
      <td class="task-title-cell" colspan="6">
        <div>${escapeHtml(task.title || "Sin tÃ­tulo")}</div>
      </td>
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
  if (task.pr_status === "Need to Impute") return true;
  if (task.pr_status === "Imputed") return task.ticket_type !== "Task";
  return false;
}

function CompletionResolveModal(task, minutesPerEffortPoint) {
  const title = {
    "Need PR": "Informar PR",
    "Need to Impute": "Imputar horas",
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
  if (task.pr_status === "Need to Impute") return NeedToImputeForm(task, minutesPerEffortPoint);
  if (task.pr_status === "Imputed") return ImputedForm(task);
  return `<p class="state warning">Esta tarea no tiene una transición de resoluciÃ³n disponible.</p>`;
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

function NeedToImputeForm(task, minutesPerEffortPoint) {
  const imputedDate = task.imputed_date || task.finished_date || todayIso();
  return `
    <form id="completion-resolve-form" class="completion-resolve-form" data-completion-status="Need to Impute">
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
