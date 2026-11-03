import { escapeHtml, todayIso } from "../utils/format.js";

export const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Month navigation shared by Calendario and Rendimiento. `scope` prefixes the data attributes main.js binds
// (data-calendar-month, data-performance-prev...). Changing month or year loads it right away.
export function MonthPicker({ scope, year, month }) {
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  return `
    <div class="period-picker" role="group" aria-label="Periodo">
      <button type="button" class="icon-button" data-${scope}-prev aria-label="Mes anterior" title="Mes anterior">${chevronIcon("left")}</button>
      <select class="period-month" data-${scope}-month aria-label="Mes">
        ${MONTHS.map((name, index) => `<option value="${index + 1}" ${month === index + 1 ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
      </select>
      <input class="period-year" data-${scope}-year type="number" min="2000" max="2100" value="${escapeHtml(year)}" aria-label="Año" />
      <button type="button" class="icon-button" data-${scope}-next aria-label="Mes siguiente" title="Mes siguiente">${chevronIcon("right")}</button>
      <button type="button" class="secondary" data-${scope}-current ${isCurrent ? "disabled" : ""}>Mes actual</button>
    </div>
  `;
}

export function DayPicker({ date }) {
  return `
    <div class="period-picker" role="group" aria-label="Día">
      <button type="button" class="icon-button" data-daily-shift="-1" aria-label="Día anterior" title="Día anterior">${chevronIcon("left")}</button>
      <input class="period-date" type="date" data-daily-date value="${escapeHtml(date)}" aria-label="Fecha del parte" />
      <button type="button" class="icon-button" data-daily-shift="1" aria-label="Día siguiente" title="Día siguiente">${chevronIcon("right")}</button>
      <button type="button" class="secondary" data-daily-today ${date === todayIso() ? "disabled" : ""}>Hoy</button>
    </div>
  `;
}

// Works on the ISO date in UTC so daylight saving changes never skip or repeat a day.
export function shiftIsoDate(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return todayIso();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function chevronIcon(direction) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="${direction === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"}"></path></svg>`;
}
