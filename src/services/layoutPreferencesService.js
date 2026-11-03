const SIDEBAR_COLLAPSED_KEY = "gestask.sidebarCollapsed";
const THEME_KEY = "gestask.theme";
const THEMES = ["system", "light", "dark"];

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

// Same storage rules as the sidebar: without storage the app follows the system theme.
export function getThemePreference() {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    return THEMES.includes(theme) ? theme : "system";
  } catch {
    return "system";
  }
}

export function setThemePreference(theme) {
  try {
    localStorage.setItem(THEME_KEY, THEMES.includes(theme) ? theme : "system");
  } catch {
    // Ignored: the theme applies to this session only.
  }
}

// "system" removes the attribute so the CSS follows prefers-color-scheme.
export function applyTheme(theme) {
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}
