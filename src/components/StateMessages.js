import { escapeHtml } from "../utils/format.js";

export function LoadingState(message = "Cargando...") {
  return `<div class="state loading">${escapeHtml(message)}</div>`;
}

export function ErrorMessage(message) {
  return message ? `<div class="state error" role="alert">${escapeHtml(message)}</div>` : "";
}

export function SuccessMessage(message) {
  return message ? `<div class="state success" role="status">${escapeHtml(message)}</div>` : "";
}

export function EmptyState(message) {
  return `<div class="state empty">${escapeHtml(message)}</div>`;
}
