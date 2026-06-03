import { callFunction } from "./apiClient.js";

export function getCalendarMonth(year, month) {
  return callFunction("calendar-month-get", { query: { year, month } });
}

export function updateCalendarDayStatus(payload) {
  return callFunction("calendar-day-status-update", { method: "PATCH", body: payload });
}
