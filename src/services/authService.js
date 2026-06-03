import { callFunction } from "./apiClient.js";
import { clearSession, setSession } from "./sessionService.js";

export async function login(credentials) {
  const data = await callFunction("auth-login", { method: "POST", body: credentials, auth: false });
  if (data.session) setSession(data.session);
  return data;
}

export async function register(payload) {
  const data = await callFunction("auth-register", { method: "POST", body: payload, auth: false });
  if (data.session) setSession(data.session);
  return data;
}

export function logout() {
  clearSession();
}
