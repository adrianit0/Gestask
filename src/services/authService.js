import { config } from "../config/env.js";
import { callFunction } from "./apiClient.js";
import { clearSession, expireSession, getSession, setSession } from "./sessionService.js";

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

// Asks Supabase Auth whether the stored token is still valid. Only a rejection (401/403) closes the session:
// a network failure or a server error leaves it as is and the next check tries again.
export async function verifySession() {
  const token = getSession()?.access_token;
  if (!token) return;
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: config.publishableKey, Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (response?.status === 401 || response?.status === 403) expireSession(token);
}
