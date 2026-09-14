import { callFunction } from "./apiClient.js";

export function listTasks(filters = {}) {
  const allowedQueryKeys = new Set(["search", "priority", "sort_by", "sort_direction"]);
  const query = Object.fromEntries(Object.entries(filters).filter(([key, value]) => allowedQueryKeys.has(key) && value));
  return callFunction("tasks-list", { query });
}

export function listDailyRoutineTasks() {
  return callFunction("tasks-list", { query: { ticket_type: "Diaria", sort_by: "created_at", sort_direction: "asc" } });
}

export function createTask(payload) {
  return callFunction("tasks-create", { method: "POST", body: payload });
}

export function updateTask(payload) {
  return callFunction("tasks-update", { method: "PATCH", body: payload });
}

export function deleteTask(id) {
  return callFunction("tasks-delete", { method: "DELETE", body: { id } });
}
