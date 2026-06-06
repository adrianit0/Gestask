export const DEFAULT_MINUTES_PER_EFFORT_POINT = 60;
export const MINUTE_PE_CONFIGURATION_NAME = "Minute_PE";

export function getMinutesPerEffortPoint(configurations = []) {
  const configuration = configurations.find((item) => item.name === MINUTE_PE_CONFIGURATION_NAME);
  const minutes = Number(configuration?.value);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_MINUTES_PER_EFFORT_POINT;
}

export function effortPointsToHours(points, minutesPerEffortPoint = DEFAULT_MINUTES_PER_EFFORT_POINT) {
  const normalizedPoints = Number(points || 0);
  const normalizedMinutes = Number(minutesPerEffortPoint || DEFAULT_MINUTES_PER_EFFORT_POINT);
  if (!Number.isFinite(normalizedPoints) || !Number.isFinite(normalizedMinutes) || normalizedMinutes <= 0) return 0;
  return (normalizedPoints * normalizedMinutes) / 60;
}

export function formatHoursFromEffortPoints(points, minutesPerEffortPoint = DEFAULT_MINUTES_PER_EFFORT_POINT) {
  return formatHours(effortPointsToHours(points, minutesPerEffortPoint));
}

export function formatHours(hours) {
  const value = Number(hours || 0);
  if (!Number.isFinite(value)) return "0 hrs";
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted} hrs`;
}
