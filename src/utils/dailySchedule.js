export const DAILY_EFFORT_CONFIGURATION_NAME = "PE_diario";
export const START_TIME_CONFIGURATION_NAME = "hora_inicio";
export const END_TIME_CONFIGURATION_NAME = "hora_fin";
export const BREAK_TIME_CONFIGURATION_NAME = "hora_descanso";
export const BREAK_DURATION_CONFIGURATION_NAME = "duracion_descanso";

const DEFAULT_DAILY_EFFORT_POINTS = 12;
const DEFAULT_START_TIME = "8:00";
const DAILY_BLOCK_DURATION_MINUTES = 60;
const DEFAULT_END_TIME = "17:30";
const DEFAULT_BREAK_TIME = "14:00";
const DEFAULT_BREAK_DURATION_MINUTES = 60;

export function buildDailySchedule(tasks = [], configurations = [], minutesPerEffortPoint = 60) {
  const settings = getDailyScheduleSettings(configurations, minutesPerEffortPoint);
  const sortedTasks = [...tasks].sort(compareByOrderDesc);
  const selectedTasks = selectTasksByEffort(sortedTasks, settings.dailyEffortPoints);
  const items = createScheduleItems(selectedTasks, settings);

  return {
    items,
    settings,
    selectedTasks,
    totalEffortPoints: selectedTasks.reduce((total, task) => total + getEffortPoints(task), 0),
  };
}

export function getDailyScheduleSettings(configurations = [], minutesPerEffortPoint = 60) {
  const startMinutes = getTimeConfiguration(configurations, START_TIME_CONFIGURATION_NAME, DEFAULT_START_TIME);
  const endMinutes = getTimeConfiguration(configurations, END_TIME_CONFIGURATION_NAME, DEFAULT_END_TIME);
  const breakStartMinutes = getTimeConfiguration(configurations, BREAK_TIME_CONFIGURATION_NAME, DEFAULT_BREAK_TIME);
  const breakDurationMinutes = getNumberConfiguration(configurations, BREAK_DURATION_CONFIGURATION_NAME, DEFAULT_BREAK_DURATION_MINUTES);
  const dailyEffortPoints = getNumberConfiguration(configurations, DAILY_EFFORT_CONFIGURATION_NAME, DEFAULT_DAILY_EFFORT_POINTS);
  const safeMinutesPerEffortPoint = Number(minutesPerEffortPoint);

  return {
    dailyEffortPoints: dailyEffortPoints > 0 ? dailyEffortPoints : DEFAULT_DAILY_EFFORT_POINTS,
    startMinutes,
    endMinutes: endMinutes > startMinutes ? endMinutes : startMinutes,
    breakStartMinutes,
    breakDurationMinutes: breakDurationMinutes > 0 ? breakDurationMinutes : DEFAULT_BREAK_DURATION_MINUTES,
    minutesPerEffortPoint: Number.isFinite(safeMinutesPerEffortPoint) && safeMinutesPerEffortPoint > 0 ? safeMinutesPerEffortPoint : 60,
  };
}

export function formatScheduleTime(minutes) {
  const normalized = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
}

function createScheduleItems(tasks, settings) {
  const items = [];
  let cursor = Math.min(settings.startMinutes + DAILY_BLOCK_DURATION_MINUTES, settings.endMinutes);
  let breakInserted = false;

  if (settings.startMinutes < settings.endMinutes) {
    items.push({
      type: "daily",
      title: "Daily",
      startMinutes: settings.startMinutes,
      endMinutes: cursor,
    });
  }

  for (const task of tasks) {
    let remainingMinutes = getEffortPoints(task) * settings.minutesPerEffortPoint;
    if (remainingMinutes <= 0) continue;

    while (remainingMinutes > 0 && cursor < settings.endMinutes) {
      if (!breakInserted && cursor >= settings.breakStartMinutes) {
        items.push(createBreakItem(settings));
        cursor = Math.min(settings.breakStartMinutes + settings.breakDurationMinutes, settings.endMinutes);
        breakInserted = true;
        continue;
      }

      const nextStop = !breakInserted && cursor < settings.breakStartMinutes
        ? Math.min(settings.breakStartMinutes, settings.endMinutes)
        : settings.endMinutes;
      const duration = Math.min(remainingMinutes, nextStop - cursor);
      if (duration <= 0) break;

      items.push({ type: "task", task, startMinutes: cursor, endMinutes: cursor + duration });
      cursor += duration;
      remainingMinutes -= duration;
    }

    if (cursor >= settings.endMinutes) break;
  }

  return items.sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
}

function createBreakItem(settings) {
  return {
    type: "break",
    title: "Descanso",
    startMinutes: settings.breakStartMinutes,
    endMinutes: Math.min(settings.breakStartMinutes + settings.breakDurationMinutes, settings.endMinutes),
  };
}

function selectTasksByEffort(tasks, dailyEffortPoints) {
  const selected = [];
  let accumulated = 0;

  for (const task of tasks) {
    const effortPoints = getEffortPoints(task);
    if (effortPoints <= 0) continue;
    if (accumulated + effortPoints > dailyEffortPoints) break;
    selected.push(task);
    accumulated += effortPoints;
    if (accumulated >= dailyEffortPoints) break;
  }

  return selected;
}

function compareByOrderDesc(a, b) {
  const orderCompared = getOrderPoints(b) - getOrderPoints(a);
  if (orderCompared !== 0) return orderCompared;
  return String(a.created_at || a.id || "").localeCompare(String(b.created_at || b.id || ""));
}

function getOrderPoints(task) {
  const value = Number(task?.order_points);
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

function getEffortPoints(task) {
  const value = Number(task?.effort_points);
  return Number.isFinite(value) ? value : 0;
}

function getNumberConfiguration(configurations, name, fallback) {
  const value = Number(configurations.find((configuration) => configuration.name === name)?.value);
  return Number.isFinite(value) ? value : fallback;
}

function getTimeConfiguration(configurations, name, fallback) {
  const value = configurations.find((configuration) => configuration.name === name)?.value ?? fallback;
  return parseTimeToMinutes(value, fallback);
}

function parseTimeToMinutes(value, fallback) {
  const parsed = parseTime(value);
  if (parsed !== null) return parsed;
  return parseTime(fallback) ?? 0;
}

function parseTime(value) {
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}
