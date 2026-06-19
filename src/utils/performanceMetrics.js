import { getDailyScheduleSettings } from "./dailySchedule.js";

export const MONTH_SCOPED_FINAL_STATUSES = new Set(["Done", "Undone", "Unfinished"]);
export const UNCOUNTED_PERFORMANCE_STATUSES = new Set(["Undone", "Unfinished"]);

// Tasks that are Undone or Unfinished never count in any performance chart or metric.
export function getCountablePerformanceTasks(tasks = []) {
  return tasks.filter((task) => !UNCOUNTED_PERFORMANCE_STATUSES.has(task.task_status));
}

export function getVisiblePerformanceTasks(tasks = [], showAll = false, now = new Date()) {
  return showAll ? tasks : tasks.filter((task) => !MONTH_SCOPED_FINAL_STATUSES.has(task.task_status) || isFinishedInCurrentMonth(task, now));
}

export function getCompletionProgressMetrics(tasks = [], calendarDays = [], configurations = [], minutesPerEffortPoint = 60, now = new Date()) {
  const doneTasks = tasks.filter((task) => task.task_status === "Done");
  const workableDays = calendarDays.filter((day) => day.status === "Laboral");
  const completedPoints = doneTasks.reduce((sum, task) => sum + Number(task.effort_points || 0), 0);
  const completedPointsUntilYesterday = doneTasks
    .filter((task) => isTaskFinishedBeforeToday(task, now))
    .reduce((sum, task) => sum + Number(task.effort_points || 0), 0);
  const currentTargetPoints = getTargetPointsUntil(workableDays, configurations, minutesPerEffortPoint, now, 0);
  const yesterdayTargetPoints = getTargetPointsUntil(workableDays, configurations, minutesPerEffortPoint, now, -1);
  const currentCompletionRatio = currentTargetPoints > 0 ? completedPoints / currentTargetPoints : 0;
  const yesterdayCompletionRatio = yesterdayTargetPoints > 0 ? completedPointsUntilYesterday / yesterdayTargetPoints : 0;

  return {
    completedPoints,
    currentTargetPoints,
    yesterdayTargetPoints,
    currentCompletionRatio,
    yesterdayCompletionRatio,
    currentCompletionPercentage: toPercentage(currentCompletionRatio),
    yesterdayCompletionPercentage: toPercentage(yesterdayCompletionRatio),
    differenceRatio: yesterdayCompletionRatio > 0 ? Number((1 / yesterdayCompletionRatio).toFixed(2)) : 0,
  };
}

function getTargetPointsUntil(workableDays, configurations, minutesPerEffortPoint, now, dayOffset) {
  const limitDate = startOfLocalDay(now);
  limitDate.setDate(limitDate.getDate() + dayOffset);
  return workableDays
    .filter((day) => isDateUntil(day.date, limitDate))
    .reduce((sum, day) => sum + getDailyScheduleSettings(configurations, minutesPerEffortPoint, day.date).dailyEffortPoints, 0);
}

function isTaskFinishedBeforeToday(task, now) {
  const date = parseTaskFinishDate(task);
  if (!date) return false;
  return startOfLocalDay(date) < startOfLocalDay(now);
}

function isDateUntil(dateValue, limitDate) {
  const [year, month, day] = String(dateValue).split("-").map(Number);
  if (!year || !month || !day) return false;
  return new Date(year, month - 1, day) <= limitDate;
}

function isFinishedInCurrentMonth(task, now) {
  const date = parseTaskFinishDate(task);
  if (!date) return false;
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function parseTaskFinishDate(task) {
  const value = task.finished_date || task.updated_at;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toPercentage(ratio) {
  return Number((ratio * 100).toFixed(1));
}
