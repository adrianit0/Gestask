import { callFunction } from "./apiClient.js";

export function listConfigurations() {
  return callFunction("configuration-list");
}

export function createConfiguration(payload) {
  return callFunction("configuration-create", { method: "POST", body: payload });
}

export function updateConfigurationProfile(payload) {
  return callFunction("configuration-profile-update", { method: "PATCH", body: payload });
}
