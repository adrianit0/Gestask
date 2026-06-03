import { config } from "../config/env.js";
import { getSession } from "./sessionService.js";

export async function callFunction(name, { method = "GET", body, query, auth = true } = {}) {
  const params = query ? `?${new URLSearchParams(query).toString()}` : "";
  const response = await fetch(`${config.supabaseUrl}/functions/v1/${name}${params}`, {
    method,
    headers: buildHeaders(auth),
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Error HTTP ${response.status}`);
  }
  return payload;
}

function buildHeaders(auth) {
  const headers = {
    "Content-Type": "application/json",
    apikey: config.publishableKey,
  };
  const token = getSession()?.access_token;
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
