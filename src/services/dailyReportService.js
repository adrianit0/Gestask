import { callFunction } from "./apiClient.js";

export function createDailyReport() {
  return callFunction("daily-report-create", { method: "POST" });
}

export function getDailyReport(date) {
  return callFunction("daily-report-get", { query: { date } });
}
