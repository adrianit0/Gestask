const SIDEBAR_COLLAPSED_KEY = "gestask.sidebarCollapsed";

// UI preference only: storage can be unavailable (private mode, blocked site data), so failures fall back to the expanded menu.
export function getSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSidebarCollapsed(collapsed) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(Boolean(collapsed)));
  } catch {
    // Ignored: the menu keeps working, the preference just isn't remembered.
  }
}
