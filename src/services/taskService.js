import { callFunction } from "./apiClient.js";

export function listTasks(filters = {}) {
  const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
  return callFunction("tasks-list", { query });
}

export function createTask(payload) {
  return callFunction("tasks-create", { method: "POST", body: payload });
}

export function updateTask(payload) {
  return callFunction("tasks-update", { method: "PATCH", body: payload });
}
