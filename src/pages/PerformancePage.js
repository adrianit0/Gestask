import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { PRIORITIES, TASK_STATUSES } from "../utils/constants.js";
import { formatHoursFromEffortPoints } from "../utils/effortTime.js";
import { escapeHtml } from "../utils/format.js";

export function PerformancePage({ tasks = [], calendarDays = [], minutesPerEffortPoint = 60, loading = false, error = "", success = "" } = {}) {
  const doneTasks = tasks.filter((task) => task.task_status === "Done");
  const completedPoints = doneTasks.reduce((sum, task) => sum + Number(task.effort_points || 0), 0);
  const completedHours = formatHoursFromEffortPoints(completedPoints, minutesPerEffortPoint);
  const openTasks = tasks.filter((task) => task.task_status !== "Done").length;
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
          ${BarList(countBy(tasks, "task_status"), TASK_STATUSES)}
        </article>
        <article class="panel chart-panel">
          <h2>Prioridad</h2>
          ${BarList(countBy(tasks, "priority"), PRIORITIES)}
        </article>
        <article class="panel chart-panel span-wide">
          <h2>Puntos completados este mes</h2>
          ${CalendarPointsChart(calendarDays)}
        </article>
      </section>
    `}
  `;
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
