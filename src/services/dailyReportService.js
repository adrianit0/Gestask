import { callFunction } from "./apiClient.js";

export function createDailyReport() {
  return callFunction("daily-report-create", { method: "POST" });
}

export function getDailyReport(date, sort = {}) {
  return callFunction("daily-report-get", { query: { date, ...sort } });
}
