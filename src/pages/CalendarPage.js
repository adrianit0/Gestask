import { ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { DAY_STATUSES } from "../utils/constants.js";
import { formatHoursFromEffortPoints } from "../utils/effortTime.js";
import { escapeHtml, truncate } from "../utils/format.js";

const WEEK_DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

export function CalendarPage({ year, month, days = [], minutesPerEffortPoint = 60, loading = false, error = "", success = "" } = {}) {
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
  return `
    <article class="calendar-day ${className}">
      <div class="calendar-day-top">
        <strong>${day.day}<small>${weekdayName}</small></strong>
        <span>${escapeHtml(day.status)}</span>
      </div>
      <div class="points">${completedPoints} pts / ${completedHours}</div>
      <select data-day-status="${day.date}" ${day.status === "Finde" ? "disabled" : ""}>
        ${DAY_STATUSES.map((status) => `<option ${day.status === status ? "selected" : ""}>${status}</option>`).join("")}
      </select>
      <div class="tickets">
        ${(day.completed_tasks ?? []).map((task) => `<button data-calendar-task="${task.id}" title="${escapeHtml(task.title)}">${escapeHtml(truncate(task.ticket || task.title))}</button>`).join("")}
      </div>
      ${day.is_today ? `<div class="today-pill">Hoy</div>` : ""}
    </article>
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
