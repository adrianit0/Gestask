import { ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { closeIcon } from "../components/TaskTable.js";
import { DAY_STATUSES } from "../utils/constants.js";
import { formatHoursFromEffortPoints } from "../utils/effortTime.js";
import { escapeHtml, truncate } from "../utils/format.js";

const WEEK_DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const CALENDAR_TASK_COLORS = {
  Bug: { background: "#ffe3df", border: "#d92d20" },
  Feature: { background: "#e9e4ff", border: "#6a5cf6" },
  Task: { background: "#dff1ff", border: "#2680eb" },
};

export function CalendarPage({ year, month, days = [], minutesPerEffortPoint = 60, loading = false, error = "", success = "", modalDay = null } = {}) {
  const current = new Date();
  const selectedYear = year ?? current.getFullYear();
  const selectedMonth = month ?? current.getMonth() + 1;
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Calendario</p>
        <h1>Rendimiento mensual</h1>
      </div>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="panel filters">
      <input data-calendar-year type="number" min="2000" max="2100" value="${selectedYear}" />
      <input data-calendar-month type="number" min="1" max="12" value="${selectedMonth}" />
      <button class="secondary" data-load-calendar>Consultar</button>
    </section>
    <section class="panel">${loading ? LoadingState() : CalendarGrid(days, minutesPerEffortPoint)}</section>
    ${modalDay ? CalendarDayModal(modalDay) : ""}
  `;
}

function CalendarDayModal(day) {
  const weekdayName = getWeekdayName(day.date);
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal calendar-day-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-day-modal-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Calendario</p>
            <h2 id="calendar-day-modal-title">${weekdayName} ${day.day} — ${escapeHtml(day.date)}</h2>
          </div>
          <button class="icon-button close-icon-button" data-close-calendar-modal aria-label="Cerrar">${closeIcon()}</button>
        </div>
        <form id="calendar-day-form" class="calendar-day-form">
          <input type="hidden" name="day" value="${escapeHtml(day.date)}" />
          <label>Tipo de día
            <select name="status">
              ${DAY_STATUSES.map((status) => `<option ${day.status === status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </label>
          <label>Observaciones
            <textarea name="note" placeholder="Ej. Mudanza, médico por la tarde...">${escapeHtml(day.note || "")}</textarea>
          </label>
          <div class="modal-actions">
            <button type="button" class="secondary" data-close-calendar-modal>Cancelar</button>
            <button type="submit" class="primary">Guardar</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function CalendarGrid(days, minutesPerEffortPoint) {
  const leadingEmptyDays = days.length ? getMondayFirstWeekdayIndex(days[0].date) : 0;
  const weekdayHeaders = WEEK_DAYS.map((day) => `<div class="calendar-weekday">${day}</div>`).join("");
  const emptyCells = Array.from({ length: leadingEmptyDays }, () => `<div class="calendar-empty" aria-hidden="true"></div>`).join("");
  const dayCards = days.map((day) => CalendarDayCard(day, minutesPerEffortPoint)).join("");

  return `<div class="calendar-grid">${weekdayHeaders}${emptyCells}${dayCards}</div>`;
}

function CalendarDayCard(day, minutesPerEffortPoint) {
  const className = dayClass(day);
  const completedPoints = Number(day.completed_points || 0);
  const completedHours = formatHoursFromEffortPoints(completedPoints, minutesPerEffortPoint);
  const weekdayName = getWeekdayName(day.date);
  const editable = day.status !== "Finde";
  return `
    <article class="calendar-day ${className} ${editable ? "calendar-day-editable" : ""}" ${editable ? `data-calendar-day="${day.date}"` : ""}>
      <div class="calendar-day-top">
        <strong>${day.day}<small>${weekdayName}</small></strong>
        <span>${escapeHtml(day.status)}</span>
      </div>
      <div class="points">${completedPoints} pts / ${completedHours}</div>
      ${day.note ? `<p class="calendar-day-note" title="${escapeHtml(day.note)}">${escapeHtml(truncate(day.note, 70))}</p>` : ""}
      <div class="tickets">
        ${(day.completed_tasks ?? []).map(CalendarTaskButton).join("")}
      </div>
      ${day.is_today ? `<div class="today-pill">Hoy</div>` : ""}
    </article>
  `;
}

function CalendarTaskButton(task) {
  const colors = CALENDAR_TASK_COLORS[task.ticket_type] ?? { background: "rgba(255, 255, 255, 0.72)", border: "rgba(0, 0, 0, 0.2)" };
  return `
    <button class="calendar-task" data-calendar-task="${task.id}" title="${escapeHtml(task.title)}" style="--ctask-bg:${colors.background}; --ctask-border:${colors.border};">
      <strong>${escapeHtml(task.ticket || truncate(task.title))}</strong>
      <span>${escapeHtml(task.title)}</span>
      <em>${Number(task.effort_points || 0)} pts</em>
    </button>
  `;
}

function dayClass(day) {
  if (["Vacaciones", "Festivos", "Ausencia", "Finde"].includes(day.status)) return day.is_today ? "special today" : "special";
  if (day.is_today) return "today";
  return day.completed_points >= 4 ? "good" : "low";
}

function getMondayFirstWeekdayIndex(dateValue) {
  return (getUtcDateFromIsoDate(dateValue).getUTCDay() + 6) % 7;
}

function getWeekdayName(dateValue) {
  return WEEK_DAYS[getMondayFirstWeekdayIndex(dateValue)];
}

function getUtcDateFromIsoDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
