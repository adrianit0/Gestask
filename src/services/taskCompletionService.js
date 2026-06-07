import { callFunction } from "./apiClient.js";

export function listCompletionTasks() {
  return callFunction("tasks-completion-list");
}

export function resolveCompletionTask(payload) {
  return callFunction("tasks-completion-resolve", { method: "PATCH", body: payload });
}
