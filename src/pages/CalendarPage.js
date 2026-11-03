import { PageHeader } from "../components/PageHeader.js";
import { MonthPicker } from "../components/PeriodControls.js";
import { LoadingState } from "../components/StateMessages.js";
import { closeIcon } from "../components/TaskTable.js";
import { DAY_STATUSES } from "../utils/constants.js";
import { getDailyScheduleSettings } from "../utils/dailySchedule.js";
import { formatHoursFromEffortPoints } from "../utils/effortTime.js";
import { escapeHtml, todayIso, truncate } from "../utils/format.js";

const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const WORK_WEEK_DAYS = 5;

const CALENDAR_TASK_COLORS = {
  Bug: { background: "#ffe3df", border: "#d92d20" },
  Feature: { background: "#e9e4ff", border: "#6a5cf6" },
  Task: { background: "#dff1ff", border: "#2680eb" },
};

export function CalendarPage({ year, month, days = [], configurations = [], minutesPerEffortPoint = 60, loading = false, modalDay = null } = {}) {
  const current = new Date();
  const selectedYear = year ?? current.getFullYear();
  const selectedMonth = month ?? current.getMonth() + 1;
  return `
    ${PageHeader({
      eyebrow: "Seguimiento",
      title: "Calendario",
      description: "Puntos completados por día laborable. Pulsa un día para marcarlo como vacaciones, festivo o ausencia.",
    })}
    <section class="panel toolbar-panel">
      <div class="toolbar">
        ${MonthPicker({ scope: "calendar", year: selectedYear, month: selectedMonth })}
        <ul class="calendar-legend" aria-label="Leyenda">
          <li><span class="legend-swatch good" aria-hidden="true"></span>Objetivo cumplido</li>
          <li><span class="legend-swatch low" aria-hidden="true"></span>Por debajo</li>
          <li><span class="legend-swatch special" aria-hidden="true"></span>No laborable</li>
        </ul>
      </div>
    </section>
    <section class="panel">${loading ? LoadingState() : CalendarGrid(days, configurations, minutesPerEffortPoint)}</section>
    ${modalDay ? CalendarDayModal(modalDay) : ""}
  `;
}

function CalendarDayModal(day) {
  const weekdayName = getWeekdayName(day.date);
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal calendar-day-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-day-modal-title" tabindex="-1">
        <div class="modal-header">
          <div class="modal-heading">
            <p class="eyebrow">Calendario · ${escapeHtml(day.date)}</p>
            <h2 id="calendar-day-modal-title">${weekdayName} ${day.day}</h2>
          </div>
          <button class="icon-button close-icon-button" data-close-calendar-modal aria-label="Cerrar" title="Cerrar (Esc)">${closeIcon()}</button>
        </div>
        <form id="calendar-day-form" class="calendar-day-form">
          <input type="hidden" name="day" value="${escapeHtml(day.date)}" />
          <label>Tipo de día
            <select name="status" autofocus>
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

function CalendarGrid(days, configurations, minutesPerEffortPoint) {
  const workDays = days.filter((day) => getMondayFirstWeekdayIndex(day.date) < WORK_WEEK_DAYS);
  const leadingEmptyDays = workDays.length ? getMondayFirstWeekdayIndex(workDays[0].date) : 0;
  const weekdayHeaders = WEEK_DAYS.slice(0, WORK_WEEK_DAYS).map((day) => `<div class="calendar-weekday">${day}</div>`).join("");
  const emptyCells = Array.from({ length: leadingEmptyDays }, () => `<div class="calendar-empty" aria-hidden="true"></div>`).join("");
  const dayCards = workDays.map((day) => CalendarDayCard(day, configurations, minutesPerEffortPoint)).join("");

  return `<div class="calendar-grid">${weekdayHeaders}${emptyCells}${dayCards}</div>`;
}

function CalendarDayCard(day, configurations, minutesPerEffortPoint) {
  const className = dayClass(day);
  const completedPoints = Number(day.completed_points || 0);
  const completedHours = formatHoursFromEffortPoints(completedPoints, minutesPerEffortPoint);
  const requiredPoints = getDailyScheduleSettings(configurations, minutesPerEffortPoint, day.date).dailyEffortPoints;
  const progress = requiredPoints > 0 ? Math.min(100, Math.round((completedPoints / requiredPoints) * 100)) : 0;
  const weekdayName = getWeekdayName(day.date);
  const editable = day.status !== "Finde";
  const workable = day.status === "Laboral";
  return `
    <article class="calendar-day ${className} ${editable ? "calendar-day-editable" : ""}" ${editable ? `data-calendar-day="${day.date}" tabindex="0" aria-label="${weekdayName} ${day.day}: ${escapeHtml(day.status)}, ${completedPoints} de ${requiredPoints} puntos"` : ""}>
      <div class="calendar-day-top">
        <strong>${day.day}<small>${weekdayName}</small></strong>
        <span class="calendar-day-tags">
          ${workable ? "" : `<span class="calendar-day-status">${escapeHtml(day.status)}</span>`}
          ${day.is_today ? `<span class="today-pill">Hoy</span>` : ""}
        </span>
      </div>
      ${workable ? `
        <div class="points">
          <span><strong>${completedPoints}</strong> / ${requiredPoints} PE</span>
          <span class="muted-text">${completedHours}</span>
        </div>
        <div class="progress" aria-hidden="true"><div style="width:${progress}%"></div></div>
      ` : ""}
      ${day.note ? `<p class="calendar-day-note" title="${escapeHtml(day.note)}">${escapeHtml(truncate(day.note, 70))}</p>` : ""}
      ${day.completed_tasks?.length ? `
        <div class="tickets">
          ${day.completed_tasks.map(CalendarTaskButton).join("")}
        </div>
      ` : ""}
    </article>
  `;
}

function CalendarTaskButton(task) {
  const colors = CALENDAR_TASK_COLORS[task.ticket_type] ?? { background: "rgba(255, 255, 255, 0.72)", border: "rgba(0, 0, 0, 0.2)" };
  return `
    <button type="button" class="calendar-task" data-calendar-task="${task.id}" title="${escapeHtml(task.title)}" style="--ctask-bg:${colors.background}; --ctask-border:${colors.border};">
      <strong>${escapeHtml(task.ticket || truncate(task.title))}</strong>
      <span>${escapeHtml(task.title)}</span>
      <em>${Number(task.effort_points || 0)} PE</em>
    </button>
  `;
}

// Days still to come stay neutral instead of showing as "below target".
function dayClass(day) {
  const today = day.is_today ? " today" : "";
  if (["Vacaciones", "Festivos", "Ausencia", "Finde"].includes(day.status)) return `special${today}`;
  if (day.is_today) return "today";
  if (day.date > todayIso()) return "future";
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
