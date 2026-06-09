import { callFunction } from "./apiClient.js";

export function listOrderTasks() {
  return callFunction("tasks-order-list");
}

export function updateOrderTasks(updates) {
  return callFunction("tasks-order-update", { method: "PATCH", body: { updates } });
}
