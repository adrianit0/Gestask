const SESSION_KEY = "gestask.session";

export const SESSION_EXPIRED_MESSAGE = "Tu sesión ha caducado. Vuelve a iniciar sesión.";

const expiredListeners = new Set();

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated() {
  return Boolean(getSession()?.access_token);
}

export function onSessionExpired(listener) {
  expiredListeners.add(listener);
}

// Only the token the server rejected is closed: a newer login, or a second rejection of the same token, does nothing.
export function expireSession(token) {
  if (!token || getSession()?.access_token !== token) return;
  clearSession();
  expiredListeners.forEach((listener) => listener());
}
