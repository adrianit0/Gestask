import { config } from "../config/env.js";
import { SESSION_EXPIRED_MESSAGE, expireSession, getSession } from "./sessionService.js";
import { trackAsyncOperation } from "./asyncTracker.js";

const OPERATION_LABELS = {
  "auth-login": "Iniciando sesión",
  "auth-register": "Registrando usuario",
  "calendar-month-get": "Cargando calendario",
  "calendar-day-status-update": "Guardando día del calendario",
  "configuration-list": "Cargando configuración",
  "configuration-create": "Creando parámetro",
  "configuration-profile-update": "Guardando parámetro",
  "daily-report-create": "Creando parte diario",
  "daily-report-get": "Cargando parte diario",
  "daily-tasks-pending": "Cargando tareas diarias pendientes",
  "daily-tasks-complete": "Guardando tarea diaria",
  "tasks-completion-list": "Cargando tareas a completar",
  "tasks-completion-resolve": "Resolviendo tarea",
  "tasks-order-list": "Cargando orden de tareas",
  "tasks-order-update": "Guardando orden de tareas",
  "tasks-list": "Cargando tareas",
  "tasks-create": "Creando tarea",
  "tasks-update": "Guardando tarea",
  "tasks-delete": "Eliminando tarea",
};

export async function callFunction(name, { method = "GET", body, query, auth = true } = {}) {
  return trackAsyncOperation(OPERATION_LABELS[name] ?? name, async () => {
    const token = auth ? getSession()?.access_token : null;
    if (auth && !token) throw new Error(SESSION_EXPIRED_MESSAGE);

    const params = query ? `?${new URLSearchParams(query).toString()}` : "";
    const response = await fetch(`${config.supabaseUrl}/functions/v1/${name}${params}`, {
      method,
      headers: buildHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));
    // Edge Functions answer 401 only when the session is missing or expired: close it instead of keeping a dead token.
    if (token && response.status === 401) {
      expireSession(token);
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
    if (!response.ok) {
      throw new Error(payload.error || `Error HTTP ${response.status}`);
    }
    return payload;
  });
}

function buildHeaders(token) {
  const headers = {
    "Content-Type": "application/json",
    apikey: config.publishableKey,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
