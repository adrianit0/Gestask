import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { PRIORITIES, TASK_STATUSES } from "../utils/constants.js";
import { formatHoursFromEffortPoints } from "../utils/effortTime.js";
import { escapeHtml } from "../utils/format.js";

const MONTH_SCOPED_FINAL_STATUSES = new Set(["Done", "Undone", "Unfinished"]);

export function PerformancePage({ tasks = [], calendarDays = [], minutesPerEffortPoint = 60, showAll = false, loading = false, error = "", success = "" } = {}) {
  const visibleTasks = showAll ? tasks : tasks.filter((task) => !MONTH_SCOPED_FINAL_STATUSES.has(task.task_status) || isFinishedInCurrentMonth(task));
  const doneTasks = visibleTasks.filter((task) => task.task_status === "Done");
  const completedPoints = doneTasks.reduce((sum, task) => sum + Number(task.effort_points || 0), 0);
  const completedHours = formatHoursFromEffortPoints(completedPoints, minutesPerEffortPoint);
  const openTasks = visibleTasks.filter((task) => !MONTH_SCOPED_FINAL_STATUSES.has(task.task_status)).length;
  const deployableTasks = doneTasks.filter((task) => ["Imputed", "Deployed"].includes(task.pr_status)).length;

  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Gráficas de Rendimiento</p>
        <h1>Rendimiento</h1>
      </div>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    ${loading ? LoadingState() : `
      <section class="panel filters performance-filters">
        <label class="checkbox-label"><input data-performance-show-all type="checkbox" ${showAll ? "checked" : ""} /> Mostrar todo</label>
      </section>
      <section class="metric-grid performance-metrics">
        ${Metric("Tareas abiertas", openTasks)}
        ${Metric("Tareas terminadas", doneTasks.length)}
        ${Metric("Puntos completados", completedPoints)}
        ${Metric("Horas completadas", completedHours)}
        ${Metric("Listas para cierre", deployableTasks)}
      </section>
      <section class="charts-grid">
        <article class="panel chart-panel">
          <h2>Estados de tarea</h2>
          ${BarList(countBy(visibleTasks, "task_status"), TASK_STATUSES)}
        </article>
        <article class="panel chart-panel">
          <h2>Prioridad</h2>
          ${BarList(countBy(visibleTasks, "priority"), PRIORITIES)}
        </article>
        <article class="panel chart-panel span-wide">
          <h2>Puntos completados este mes</h2>
          ${CalendarPointsChart(calendarDays)}
        </article>
        <article class="panel chart-panel span-wide">
          <h2>Puntos nuevos este mes</h2>
          ${DailyNewPointsChart(calendarDays, tasks)}
        </article>
        <article class="panel chart-panel span-wide">
          <h2>Diferencia entre nuevas y terminadas</h2>
          ${DailyPointDifferenceChart(calendarDays, tasks)}
        </article>
        <article class="panel chart-panel span-wide">
          <h2>Tareas terminadas por dia</h2>
          ${DailyCompletedTasksChart(calendarDays)}
        </article>
        <article class="panel chart-panel span-wide">
          <h2>Tareas creadas por dia</h2>
          ${DailyCreatedTasksChart(calendarDays, tasks)}
        </article>
        <article class="panel chart-panel span-wide">
          <h2>Diferencia entre nuevas y terminadas</h2>
          ${DailyTaskDifferenceChart(calendarDays, tasks)}
        </article>
        <article class="panel chart-panel span-wide">
          <h2>Ritmo acumulado del mes</h2>
          ${CumulativePointsChart(calendarDays)}
        </article>
        <article class="panel chart-panel span-wide">
          <h2>Ritmo acumulado creado + terminado</h2>
          ${CumulativeCreatedCompletedChart(calendarDays, tasks)}
        </article>
        <article class="panel chart-panel">
          <h2>Trabajo por dia de la semana</h2>
          ${WeekdayCompletionChart(calendarDays)}
        </article>
      </section>
    `}
  `;
}

function DailyCompletedTasksChart(days) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver tareas terminadas por dia.");
  const values = days.map((day) => getCompletedTasksCount(day));
  const max = Math.max(1, ...values);
  return `
    <div class="daily-bars" aria-label="Tareas terminadas por dia">
      ${days.map((day) => {
        const value = getCompletedTasksCount(day);
        const height = value ? Math.max(12, Math.round((value / max) * 150)) : 8;
        return `
          <div class="daily-bar task-bar" title="${escapeHtml(`${day.date}: ${value} tareas terminadas`)}">
            <div style="height:${height}px"></div>
            <strong>${value}</strong>
            <span>${day.day}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function isFinishedInCurrentMonth(task) {
  const date = parseTaskFinishDate(task);
  if (!date) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function parseTaskFinishDate(task) {
  const value = task.finished_date || task.updated_at;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function Metric(label, value) {
  return `<article class="panel metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function countBy(items, key) {
  return items.reduce((map, item) => {
    map[item[key]] = (map[item[key]] ?? 0) + 1;
    return map;
  }, {});
}

function BarList(counts, labels) {
  const max = Math.max(1, ...Object.values(counts));
  const rows = labels.map((label) => {
    const value = counts[label] ?? 0;
    const width = Math.round((value / max) * 100);
    return `
      <div class="bar-row">
        <span>${escapeHtml(label)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
        <strong>${value}</strong>
      </div>
    `;
  }).join("");
  return rows || EmptyState("No hay datos suficientes.");
}

function CalendarPointsChart(days) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver puntos por día.");
  const max = Math.max(1, ...days.map((day) => Number(day.completed_points || 0)));
  return `
    <div class="daily-bars" aria-label="Puntos completados por día">
      ${days.map((day) => {
        const value = Number(day.completed_points || 0);
        const height = Math.max(8, Math.round((value / max) * 150));
        return `
          <div class="daily-bar" title="${escapeHtml(`${day.date}: ${value} puntos`)}">
            <div style="height:${height}px"></div>
            <span>${day.day}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function CumulativePointsChart(days) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver el acumulado.");
  let total = 0;
  const accumulatedDays = days.map((day) => {
    total += Number(day.completed_points || 0);
    return { ...day, accumulated: total };
  });
  const max = Math.max(1, ...accumulatedDays.map((day) => day.accumulated));
  return `
    <div class="daily-bars cumulative-bars" aria-label="Puntos completados acumulados por dia">
      ${accumulatedDays.map((day) => {
        const height = day.accumulated ? Math.max(12, Math.round((day.accumulated / max) * 170)) : 8;
        return `
          <div class="daily-bar cumulative-bar" title="${escapeHtml(`${day.date}: ${day.accumulated} puntos acumulados`)}">
            <div style="height:${height}px"></div>
            <strong>${day.accumulated}</strong>
            <span>${day.day}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function WeekdayCompletionChart(days) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver el resumen semanal.");
  const weekdayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const totals = weekdayLabels.map((label) => ({ label, points: 0, tasks: 0 }));
  days.forEach((day) => {
    const weekdayIndex = getMondayFirstWeekdayIndex(day.date);
    totals[weekdayIndex].points += Number(day.completed_points || 0);
    totals[weekdayIndex].tasks += getCompletedTasksCount(day);
  });
  const max = Math.max(1, ...totals.map((item) => item.points));
  return `
    <div class="weekday-bars" aria-label="Trabajo terminado por dia de la semana">
      ${totals.map((item) => {
        const height = item.points ? Math.max(12, Math.round((item.points / max) * 150)) : 8;
        return `
          <div class="weekday-bar" title="${escapeHtml(`${item.label}: ${item.points} puntos, ${item.tasks} tareas`)}">
            <div style="height:${height}px"></div>
            <strong>${item.points}</strong>
            <span>${item.label}</span>
            <small>${item.tasks} tareas</small>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function getCompletedTasksCount(day) {
  return (day.completed_tasks ?? []).length;
}

function getMondayFirstWeekdayIndex(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

function DailyNewPointsChart(days, tasks) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver puntos nuevos por dia.");
  const assignedStats = getAssignedStatsByDay(days, tasks);
  const values = days.map((day) => assignedStats.get(day.date)?.points ?? 0);
  const max = Math.max(1, ...values);
  return `
    <div class="daily-bars" aria-label="Puntos nuevos por dia">
      ${days.map((day) => {
        const value = assignedStats.get(day.date)?.points ?? 0;
        const height = value ? Math.max(12, Math.round((value / max) * 150)) : 8;
        return `
          <div class="daily-bar created-points-bar" title="${escapeHtml(`${day.date}: ${value} puntos nuevos`)}">
            <div style="height:${height}px"></div>
            <strong>${value}</strong>
            <span>${day.day}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function DailyPointDifferenceChart(days, tasks) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver la diferencia de puntos.");
  const assignedStats = getAssignedStatsByDay(days, tasks);
  const values = days.map((day) => (assignedStats.get(day.date)?.points ?? 0) - Number(day.completed_points || 0));
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  return DifferenceBars(days, values, max, "puntos", "Diferencia diaria entre puntos nuevos y completados");
}

function DailyCreatedTasksChart(days, tasks) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver tareas creadas por dia.");
  const assignedStats = getAssignedStatsByDay(days, tasks);
  const values = days.map((day) => assignedStats.get(day.date)?.tasks ?? 0);
  const max = Math.max(1, ...values);
  return `
    <div class="daily-bars" aria-label="Tareas creadas por dia">
      ${days.map((day) => {
        const value = assignedStats.get(day.date)?.tasks ?? 0;
        const height = value ? Math.max(12, Math.round((value / max) * 150)) : 8;
        return `
          <div class="daily-bar created-task-bar" title="${escapeHtml(`${day.date}: ${value} tareas creadas`)}">
            <div style="height:${height}px"></div>
            <strong>${value}</strong>
            <span>${day.day}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function DailyTaskDifferenceChart(days, tasks) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver la diferencia de tareas.");
  const assignedStats = getAssignedStatsByDay(days, tasks);
  const values = days.map((day) => (assignedStats.get(day.date)?.tasks ?? 0) - getCompletedTasksCount(day));
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  return DifferenceBars(days, values, max, "tareas", "Diferencia diaria entre tareas nuevas y terminadas");
}

function CumulativeCreatedCompletedChart(days, tasks) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver el acumulado creado y terminado.");
  const assignedStats = getAssignedStatsByDay(days, tasks);
  let total = 0;
  const values = days.map((day) => {
    total += (assignedStats.get(day.date)?.points ?? 0) + Number(day.completed_points || 0);
    return total;
  });
  const max = Math.max(1, ...values);
  return `
    <div class="daily-bars cumulative-bars" aria-label="Puntos acumulados creados y terminados">
      ${days.map((day, index) => {
        const value = values[index];
        const height = value ? Math.max(12, Math.round((value / max) * 170)) : 8;
        return `
          <div class="daily-bar combined-cumulative-bar" title="${escapeHtml(`${day.date}: ${value} puntos creados + terminados acumulados`)}">
            <div style="height:${height}px"></div>
            <strong>${value}</strong>
            <span>${day.day}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function DifferenceBars(days, values, max, unit, label) {
  return `
    <div class="daily-bars difference-bars" aria-label="${escapeHtml(label)}">
      ${days.map((day, index) => {
        const value = values[index];
        const height = value ? Math.max(12, Math.round((Math.abs(value) / max) * 130)) : 8;
        const className = value < 0 ? "negative" : value > 0 ? "positive" : "neutral";
        const formattedValue = value > 0 ? `+${value}` : String(value);
        return `
          <div class="daily-bar difference-bar ${className}" title="${escapeHtml(`${day.date}: ${formattedValue} ${unit}`)}">
            <div style="height:${height}px"></div>
            <strong>${formattedValue}</strong>
            <span>${day.day}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function getAssignedStatsByDay(days, tasks) {
  const stats = new Map(days.map((day) => [day.date, { tasks: 0, points: 0 }]));
  tasks.forEach((task) => {
    const date = getTaskAssignedDate(task);
    if (!stats.has(date)) return;
    const current = stats.get(date);
    current.tasks += 1;
    current.points += Number(task.effort_points || 0);
  });
  return stats;
}

function getTaskAssignedDate(task) {
  return String(task.assigned_date || "").slice(0, 10);
}

