import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { BacklogTaskButton, TaskDetailModal, closeIcon } from "../components/TaskTable.js";
import { PR_BORDER_COLORS } from "../utils/constants.js";
import { escapeHtml, todayIso } from "../utils/format.js";
import { ticketLinkHtml } from "../utils/projectSettings.js";
import { effortPointsToHours, formatHoursFromEffortPoints } from "../utils/effortTime.js";
import { getCompletionProgressMetrics, getVisiblePerformanceTasks } from "../utils/performanceMetrics.js";

export function getDeployableImputedTasks(tasks = []) {
  return tasks.filter((task) => task.pr_status === "Imputed" && task.ticket_type !== "Task");
}

export function getAdvanceableNeedPrTasks(tasks = []) {
  return tasks.filter((task) => task.pr_status === "Need PR" && task.ticket_type !== "Task");
}

export function getPendingImputationTasks(tasks = []) {
  return sortCompletionTasks(tasks.filter((task) => task.pr_status === "Need to Impute"));
}

export function getDefaultImputedDate(task) {
  return toIsoDate(task.imputed_date) || toIsoDate(task.finished_date) || todayIso();
}

export function CompletionTasksPage({ tasks = [], performanceTasks = [], calendarDays = [], configurations = [], minutesPerEffortPoint = 60, referenceDate = new Date(), loading = false, error = "", success = "", modalTask = null, detailTask = null, bulkImputeOpen = false, bulkImputeSelection = new Set() } = {}) {
  const completionProgress = getCompletionProgressMetrics(getVisiblePerformanceTasks(performanceTasks, false, referenceDate), calendarDays, configurations, minutesPerEffortPoint, referenceDate);
  const deployableImputedCount = getDeployableImputedTasks(tasks).length;
  const advanceableNeedPrCount = getAdvanceableNeedPrTasks(tasks).length;
  const pendingImputationTasks = getPendingImputationTasks(tasks);
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Completar tareas</p>
        <h1>Cierre de workflow</h1>
      </div>
      <div class="page-header-actions">
        ${advanceableNeedPrCount ? `
          <button class="secondary" type="button" data-advance-all-need-pr>Informar PR de todas (${advanceableNeedPrCount})</button>
        ` : ""}
        ${deployableImputedCount ? `
          <button class="primary" type="button" data-close-all-imputed>Cerrar imputadas (${deployableImputedCount})</button>
        ` : ""}
      </div>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    ${loading ? "" : BulkImputationPanel(pendingImputationTasks, minutesPerEffortPoint, completionProgress.differenceRatio, { open: bulkImputeOpen, selectedIds: bulkImputeSelection })}
    <section class="panel">
      ${loading ? LoadingState() : CompletionTasksTable(tasks, minutesPerEffortPoint)}
    </section>
    ${modalTask ? CompletionResolveModal(modalTask, minutesPerEffortPoint, completionProgress.differenceRatio) : ""}
    ${detailTask ? TaskDetailModal(detailTask, { readonly: true }) : ""}
  `;
}

function BulkImputationPanel(tasks, minutesPerEffortPoint, differenceRatio, { open = false, selectedIds = new Set() } = {}) {
  if (!tasks.length) return "";
  const rows = tasks.map((task) => {
    const hoursToImpute = effortPointsToHours(task.effort_points, minutesPerEffortPoint);
    return {
      task,
      hoursToImpute,
      reviewedHoursToImpute: differenceRatio > 0 ? hoursToImpute * differenceRatio : 0,
      selected: selectedIds.has(task.id),
    };
  });

  return `
    <section class="panel bulk-impute-panel">
      <div class="bulk-impute-header">
        <div>
          <p class="eyebrow">Imputación masiva</p>
          <h2>Pendientes de imputar (${rows.length})</h2>
        </div>
        <button class="secondary" type="button" data-toggle-bulk-impute>${open ? "Ocultar tabla" : "Ver tabla"}</button>
      </div>
      ${open ? BulkImputationBody(rows) : ""}
    </section>
  `;
}

function BulkImputationBody(rows) {
  const selectedRows = rows.filter((row) => row.selected);
  const totalHours = sumHours(rows, "hoursToImpute");
  const totalReviewedHours = sumHours(rows, "reviewedHoursToImpute");
  const selectedHours = sumHours(selectedRows, "hoursToImpute");
  const selectedReviewedHours = sumHours(selectedRows, "reviewedHoursToImpute");
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  return `
    <label class="bulk-impute-date">Fecha de imputación
      <input id="bulk-impute-date" type="date" value="${escapeHtml(todayIso())}" />
    </label>
    <div class="table-wrap">
      <table class="task-table task-table-impute">
        <thead>
          <tr>
            <th class="bulk-impute-check-column">
              <input type="checkbox" data-impute-select-all ${allSelected ? "checked" : ""} aria-label="Seleccionar todas" />
            </th>
            <th>Ticket</th>
            <th>Fecha de resolución</th>
            <th>Horas a imputar</th>
            <th>Horas a imputar revisado</th>
            <th class="bulk-impute-info-column" aria-label="Título"></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(BulkImputationRow).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">Total</td>
            <td>${escapeHtml(formatHoursAndMinutes(totalHours))}</td>
            <td>${escapeHtml(formatHoursAndMinutes(totalReviewedHours, { roundMinutesToNearest: 10 }))}</td>
            <td></td>
          </tr>
          <tr>
            <td colspan="3">Total seleccionado (${selectedRows.length})</td>
            <td>${escapeHtml(formatHoursAndMinutes(selectedHours))}</td>
            <td>${escapeHtml(formatHoursAndMinutes(selectedReviewedHours, { roundMinutesToNearest: 10 }))}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="modal-actions">
      <button class="primary" type="button" data-impute-all ${selectedRows.length ? "" : "disabled"}>Imputar seleccionadas (${selectedRows.length})</button>
    </div>
  `;
}

function BulkImputationRow({ task, hoursToImpute, reviewedHoursToImpute, selected }) {
  const title = task.title || "Sin título";
  return `
    <tr class="${selected ? "bulk-impute-row-selected" : ""}">
      <td class="bulk-impute-check-cell">
        <input type="checkbox" data-impute-select="${escapeHtml(task.id)}" ${selected ? "checked" : ""} aria-label="Marcar ${escapeHtml(task.ticket || title)} como imputada" />
      </td>
      <td>${ticketCell(task.ticket)}</td>
      <td>${escapeHtml(task.finished_date || "-")}</td>
      <td>${escapeHtml(formatHoursAndMinutes(hoursToImpute))}</td>
      <td>${escapeHtml(formatHoursAndMinutes(reviewedHoursToImpute, { roundMinutesToNearest: 10 }))}</td>
      <td class="bulk-impute-info-cell">
        <span class="bulk-impute-info" title="${escapeHtml(title)}" tabindex="0" role="img" aria-label="${escapeHtml(title)}">${infoIcon()}</span>
      </td>
    </tr>
  `;
}

function sumHours(rows, key) {
  return rows.reduce((sum, row) => sum + row[key], 0);
}

function infoIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 11v5"></path>
      <path d="M12 8h0.01"></path>
    </svg>
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
            <th class="backlog-link-column" aria-label="Backlog"></th>
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
      <td class="backlog-link-cell">${BacklogTaskButton(task.id)}</td>
    </tr>
    <tr class="task-title-row clickable-row" ${clickableAttrs} style="${visualStyle}">
      <td class="task-title-cell" colspan="7">
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

function CompletionResolveModal(task, minutesPerEffortPoint, differenceRatio) {
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
          <button class="icon-button close-icon-button" data-close-completion-modal aria-label="Cerrar">${closeIcon()}</button>
        </div>
        ${CompletionResolveForm(task, minutesPerEffortPoint, differenceRatio)}
      </section>
    </div>
  `;
}

function CompletionResolveForm(task, minutesPerEffortPoint, differenceRatio) {
  if (task.pr_status === "Need PR") return NeedPrForm(task);
  if (task.pr_status === "Need to Impute") return NeedToImputeForm(task, minutesPerEffortPoint, differenceRatio);
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

function NeedToImputeForm(task, minutesPerEffortPoint, differenceRatio) {
  const imputedDate = task.imputed_date || task.finished_date || todayIso();
  const hoursToImpute = effortPointsToHours(task.effort_points, minutesPerEffortPoint);
  const reviewedHoursToImpute = differenceRatio > 0 ? hoursToImpute * differenceRatio : 0;
  return `
    <form id="completion-resolve-form" class="completion-resolve-form" data-completion-status="Need to Impute">
      <input type="hidden" name="id" value="${escapeHtml(task.id)}" />
      <div class="completion-summary">
        <p><span>Ticket</span>${ticketCell(task.ticket)}</p>
        <p><span>Título</span><strong>${escapeHtml(task.title || "Sin título")}</strong></p>
        <p><span>Fecha de resolución</span><strong>${escapeHtml(task.finished_date || "-")}</strong></p>
        <p><span>Horas a imputar</span><strong>${escapeHtml(formatHoursAndMinutes(hoursToImpute))}</strong></p>
        <p><span>Horas a imputar revisado</span><strong>${escapeHtml(formatHoursAndMinutes(reviewedHoursToImpute, { roundMinutesToNearest: 10 }))}</strong></p>
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
  return ticketLinkHtml(value);
}

function toIsoDate(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const match = text.match(/^(d{4}-d{2}-d{2})/);
  return match ? match[1] : "";
}

function formatHoursAndMinutes(hours, { roundMinutesToNearest = 1 } = {}) {
  const value = Number(hours || 0);
  if (!Number.isFinite(value) || value <= 0) return "0h";

  const nearest = Number(roundMinutesToNearest);
  const minuteStep = Number.isFinite(nearest) && nearest > 0 ? nearest : 1;
  const totalMinutes = Math.round((value * 60) / minuteStep) * minuteStep;
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (wholeHours && minutes) return `${wholeHours}h ${minutes}m`;
  if (wholeHours) return `${wholeHours}h`;
  return `${minutes}m`;
}
