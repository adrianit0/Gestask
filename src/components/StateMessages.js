import { escapeHtml } from "../utils/format.js";

export function LoadingState(message = "Cargando...") {
  return `<div class="state loading" role="status"><span class="spinner" aria-hidden="true"></span>${escapeHtml(message)}</div>`;
}

export function ErrorMessage(message) {
  return message ? `<div class="state error" role="alert">${escapeHtml(message)}</div>` : "";
}

export function SuccessMessage(message) {
  return message ? `<div class="state success" role="status">${escapeHtml(message)}</div>` : "";
}

export function EmptyState(message) {
  return `
    <div class="state empty">
      <span class="empty-icon" aria-hidden="true">${inboxIcon()}</span>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

// Floating notices for the app pages: they no longer push the content down. Success notices auto-dismiss (see main.js).
export function Toasts({ error = "", success = "" } = {}) {
  return `
    <div class="toast-region">
      ${error ? toast("error", error) : ""}
      ${success ? toast("success", success) : ""}
    </div>
  `;
}

function toast(kind, message) {
  return `
    <div class="toast toast-${kind}" role="${kind === "error" ? "alert" : "status"}" data-toast="${kind}">
      <span class="toast-icon" aria-hidden="true">${kind === "error" ? alertIcon() : checkIcon()}</span>
      <p>${escapeHtml(message)}</p>
      <button type="button" class="toast-close" data-dismiss-toast="${kind}" aria-label="Cerrar aviso">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg>
      </button>
    </div>
  `;
}

function checkIcon() {
  return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="m8 12.5 2.5 2.5L16 9.5"></path></svg>`;
}

function alertIcon() {
  return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5"></path><path d="M12 16.5h.01"></path></svg>`;
}

function inboxIcon() {
  return `<svg viewBox="0 0 24 24"><path d="M3 13h5l1.5 2.5h5L16 13h5"></path><path d="M5.5 5h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z"></path></svg>`;
}
