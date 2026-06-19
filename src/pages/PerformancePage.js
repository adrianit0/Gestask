import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { PRIORITIES, TASK_STATUSES } from "../utils/constants.js";
import { getDailyScheduleSettings, isIntensiveDate } from "../utils/dailySchedule.js";
import { formatHoursFromEffortPoints } from "../utils/effortTime.js";
import { escapeHtml } from "../utils/format.js";
import { getCompletionProgressMetrics, getCountablePerformanceTasks, getVisiblePerformanceTasks, MONTH_SCOPED_FINAL_STATUSES, UNCOUNTED_PERFORMANCE_STATUSES } from "../utils/performanceMetrics.js";

const PERFORMANCE_TASK_STATUSES = TASK_STATUSES.filter((status) => !UNCOUNTED_PERFORMANCE_STATUSES.has(status));

const CHART_GROUPS = [
  { id: "points", label: "Rendimiento de puntos" },
  { id: "tasks", label: "Rendimiento de tareas" },
  { id: "cumulative", label: "Rendimiento acumulado" },
  { id: "distribution", label: "Distribución y resumen" },
];

export function PerformancePage({ tasks = [], calendarDays = [], configurations = [], minutesPerEffortPoint = 60, showAll = false, chartGroup = "points", loading = false, error = "", success = "" } = {}) {
  const countableTasks = getCountablePerformanceTasks(tasks);
  const visibleTasks = getVisiblePerformanceTasks(countableTasks, showAll);
  const doneTasks = visibleTasks.filter((task) => task.task_status === "Done");
  const completedPoints = doneTasks.reduce((sum, task) => sum + Number(task.effort_points || 0), 0);
  const completedHours = formatHoursFromEffortPoints(completedPoints, minutesPerEffortPoint);
  const openTasks = visibleTasks.filter((task) => !MONTH_SCOPED_FINAL_STATUSES.has(task.task_status)).length;
  const deployableTasks = doneTasks.filter((task) => ["Imputed", "Deployed"].includes(task.pr_status)).length;
  const workableDays = calendarDays.filter((day) => day.status === "Laboral");
  const intensiveDays = workableDays.filter((day) => isIntensiveDate(day.date, configurations)).length;
  const monthlyTargetPoints = workableDays.reduce((sum, day) => sum + getDailyScheduleSettings(configurations, minutesPerEffortPoint, day.date).dailyEffortPoints, 0);
  const currentTargetPoints = workableDays.filter((day) => isDateUntilToday(day.date)).reduce((sum, day) => sum + getDailyScheduleSettings(configurations, minutesPerEffortPoint, day.date).dailyEffortPoints, 0);
  const monthlyCompletionPercentage = monthlyTargetPoints > 0 ? Number(((completedPoints / monthlyTargetPoints) * 100).toFixed(1)) : 0;
  const currentMonthPercentage = monthlyTargetPoints > 0 ? Number(((currentTargetPoints / monthlyTargetPoints) * 100).toFixed(1)) : 0;
  const completionProgress = getCompletionProgressMetrics(visibleTasks, calendarDays, configurations, minutesPerEffortPoint);
  const activeGroup = CHART_GROUPS.some((group) => group.id === chartGroup) ? chartGroup : CHART_GROUPS[0].id;

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
        ${Metric("Listas para cierre", deployableTasks)}
      </section>
      <section class="metric-grid performance-metrics">
        ${Metric("PE completados", completedPoints)}
        ${showAll ? "" : Metric("PE totales del mes", monthlyTargetPoints)}
        ${showAll ? "" : Metric("% completado del mes", `${monthlyCompletionPercentage}%`)}
      </section>
      ${showAll ? "" : `
        <section class="metric-grid performance-metrics">
          ${Metric("% actual del mes", `${currentMonthPercentage}%`)}
          ${Metric("% completado hasta ahora", `${completionProgress.currentCompletionPercentage}% / ${completionProgress.yesterdayCompletionPercentage}%`)}
          ${Metric("Ratio de diferencia", completionProgress.differenceRatio ? `x${completionProgress.differenceRatio}` : "0")}
        </section>
      `}
      <section class="metric-grid performance-metrics">
        ${Metric("Horas completadas", completedHours)}
        ${Metric("Dias laborables del mes", workableDays.length)}
        ${Metric("Dias intensivos del mes", intensiveDays)}
      </section>
      <section class="distribution-charts">
        ${ChartPanel("Estados de tarea", BarList(countBy(visibleTasks, "task_status"), PERFORMANCE_TASK_STATUSES))}
        ${ChartPanel("Prioridad", BarList(countBy(visibleTasks, "priority"), PRIORITIES))}
      </section>
      <section class="performance-charts">
        <aside class="performance-chart-menu" aria-label="Grupos de graficas">
          ${CHART_GROUPS.map((group) => `
            <button class="chart-menu-item ${group.id === activeGroup ? "active" : ""}" data-performance-group="${group.id}" aria-pressed="${group.id === activeGroup}">
              ${escapeHtml(group.label)}
            </button>
          `).join("")}
        </aside>
        <div class="performance-chart-content">
          ${renderChartGroup(activeGroup, { visibleTasks, countableTasks, calendarDays })}
        </div>
      </section>
    `}
  `;
}

function ChartPanel(title, body) {
  return `
    <article class="panel chart-panel">
      <h2>${escapeHtml(title)}</h2>
      ${body}
    </article>
  `;
}

function renderChartGroup(groupId, { visibleTasks, countableTasks, calendarDays }) {
  if (groupId === "tasks") {
    return [
      ChartPanel("Tareas terminadas por dia", DailyCompletedTasksChart(calendarDays)),
      ChartPanel("Tareas creadas por dia", DailyCreatedTasksChart(calendarDays, countableTasks)),
      ChartPanel("Diferencia entre nuevas y terminadas", DailyTaskDifferenceChart(calendarDays, countableTasks)),
    ].join("");
  }
  if (groupId === "cumulative") {
    return [
      ChartPanel("Ritmo terminado acumulado del mes", CumulativeCompletedPointsChart(calendarDays)),
      ChartPanel("Ritmo acumulado creado del mes", CumulativeCreatedPointsChart(calendarDays, countableTasks)),
      ChartPanel("Diferencia entre nuevas y terminadas", CumulativeCreatedCompletedChart(calendarDays, countableTasks)),
    ].join("");
  }
  if (groupId === "distribution") {
    return ChartPanel("Trabajo por dia de la semana", WeekdayCompletionChart(calendarDays));
  }
  return [
    ChartPanel("Puntos completados este mes", CalendarPointsChart(calendarDays)),
    ChartPanel("Puntos nuevos este mes", DailyNewPointsChart(calendarDays, countableTasks)),
    ChartPanel("Diferencia entre nuevas y terminadas", DailyPointDifferenceChart(calendarDays, countableTasks)),
  ].join("");
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

function isDateUntilToday(dateValue) {
  const [year, month, day] = String(dateValue).split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(year, month - 1, day);
  const today = new Date();
  return date <= new Date(today.getFullYear(), today.getMonth(), today.getDate());
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

function CumulativeCompletedPointsChart(days) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver el acumulado terminado.");
  const values = accumulate(days.map((day) => Number(day.completed_points || 0)));
  return LineChart(days, values, "puntos terminados acumulados", "Puntos terminados acumulados por dia");
}

function CumulativeCreatedPointsChart(days, tasks) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver el acumulado creado.");
  const assignedStats = getAssignedStatsByDay(days, tasks);
  // Convenio: lo creado cuenta como negativo, por lo que el acumulado se dibuja por debajo del 0.
  const values = accumulate(days.map((day) => -(assignedStats.get(day.date)?.points ?? 0)));
  return LineChart(days, values, "puntos creados acumulados", "Puntos creados acumulados por dia");
}

function accumulate(values) {
  let total = 0;
  return values.map((value) => (total += value));
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
  const values = days.map((day) => Number(day.completed_points || 0) - (assignedStats.get(day.date)?.points ?? 0));
  return LineChart(days, values, "puntos", "Diferencia diaria entre puntos terminados y nuevos");
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
  const values = days.map((day) => getCompletedTasksCount(day) - (assignedStats.get(day.date)?.tasks ?? 0));
  return LineChart(days, values, "tareas", "Diferencia diaria entre tareas terminadas y nuevas");
}

function CumulativeCreatedCompletedChart(days, tasks) {
  if (!days.length) return EmptyState("Consulta un mes en Calendario para ver el acumulado creado y terminado.");
  const assignedStats = getAssignedStatsByDay(days, tasks);
  const values = accumulate(days.map((day) => Number(day.completed_points || 0) - (assignedStats.get(day.date)?.points ?? 0)));
  return LineChart(days, values, "puntos terminados - creados acumulados", "Acumulado de puntos terminados menos creados");
}

function LineChart(days, values, unit, label) {
  const step = 36;
  const plotHeight = 150;
  const paddingTop = 20;
  const paddingBottom = 26;
  const width = Math.max(days.length * step, step);
  const height = paddingTop + plotHeight + paddingBottom;
  const top = Math.max(0, ...values);
  const bottom = Math.min(0, ...values);
  const range = (top - bottom) || 1;
  const xFor = (index) => Math.round(step / 2 + index * step);
  const yFor = (value) => Math.round(paddingTop + ((top - value) / range) * plotHeight);
  const zeroY = yFor(0);
  const points = values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" ");
  return `
    <div class="line-chart" role="img" aria-label="${escapeHtml(label)}">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <line class="line-zero" x1="0" y1="${zeroY}" x2="${width}" y2="${zeroY}"></line>
        <polyline class="line-path" points="${points}"></polyline>
        ${days.map((day, index) => {
          const value = values[index];
          const className = value < 0 ? "negative" : value > 0 ? "positive" : "neutral";
          const formattedValue = value > 0 ? `+${value}` : String(value);
          const valueY = value < 0 ? yFor(value) + 16 : yFor(value) - 9;
          return `
            <g class="line-point ${className}">
              <circle cx="${xFor(index)}" cy="${yFor(value)}" r="4"><title>${escapeHtml(`${day.date}: ${formattedValue} ${unit}`)}</title></circle>
              <text class="line-value" x="${xFor(index)}" y="${valueY}" text-anchor="middle">${formattedValue}</text>
              <text class="line-label" x="${xFor(index)}" y="${height - 8}" text-anchor="middle">${escapeHtml(String(day.day))}</text>
            </g>
          `;
        }).join("")}
      </svg>
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
