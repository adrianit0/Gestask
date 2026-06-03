import { ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { DAY_STATUSES } from "../utils/constants.js";
import { escapeHtml, truncate } from "../utils/format.js";

export function CalendarPage({ year, month, days = [], loading = false, error = "", success = "" } = {}) {
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
    <section class="panel">${loading ? LoadingState() : CalendarGrid(days)}</section>
  `;
}

function CalendarGrid(days) {
  return `<div class="calendar-grid">${days.map(CalendarDayCard).join("")}</div>`;
}

function CalendarDayCard(day) {
  const className = dayClass(day);
  return `
    <article class="calendar-day ${className}">
      <div class="calendar-day-top">
        <strong>${day.day}</strong>
        <span>${escapeHtml(day.status)}</span>
      </div>
      <div class="points">${day.completed_points} pts</div>
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
