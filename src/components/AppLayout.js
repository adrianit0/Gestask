import { AsyncActivityIndicator } from "./AsyncActivity.js";
import { DailyPendingIndicator } from "./DailyTasks.js";
import { Toasts } from "./StateMessages.js";
import { getAsyncOperations } from "../services/asyncTracker.js";
import { escapeHtml } from "../utils/format.js";

const NAV_SECTIONS = [
  {
    title: "Tareas",
    items: [
      { page: "backlog", label: "Backlog", icon: "backlog" },
      { page: "kanban", label: "Kanban", icon: "kanban" },
      { page: "order", label: "Ordenar tareas", icon: "order" },
      { page: "completion", label: "Completar tareas", icon: "completion", badge: completionBadge },
    ],
  },
  {
    title: "Día a día",
    items: [
      { page: "daily", label: "Tareas diarias", icon: "daily" },
      { page: "dailySchedule", label: "Horario diario", icon: "dailySchedule" },
      { page: "dailyRoutine", label: "Diarias", icon: "dailyRoutine" },
    ],
  },
  {
    title: "Seguimiento",
    items: [
      { page: "calendar", label: "Calendario", icon: "calendar" },
      { page: "time", label: "Gestor de tiempos", icon: "time" },
      { page: "charts", label: "Gráficas de rendimiento", icon: "charts" },
    ],
  },
];

const CONFIGURATION_ITEM = { page: "configuration", label: "Configuración", icon: "configuration" };

const COMPLETION_BADGE_STATUSES = ["Need PR", "Need to Impute", "Imputed"];

// The toggle cycles system → light → dark; "system" follows prefers-color-scheme.
const THEME_OPTIONS = {
  system: { label: "Tema del sistema", icon: "themeSystem", next: "light" },
  light: { label: "Tema claro", icon: "themeLight", next: "dark" },
  dark: { label: "Tema oscuro", icon: "themeDark", next: "system" },
};

export function AppLayout(activePage, content, { dailyPending = {}, completionTasks = [], collapsed = false, userEmail = "", theme = "system", messages = {} } = {}) {
  const context = { completionTasks };

  return `
    <div class="app-frame ${collapsed ? "nav-collapsed" : ""}" data-app-frame>
      <aside class="side-nav">
        <div class="side-nav-header">
          <button type="button" class="side-nav-icon-button side-nav-mobile-toggle" data-action="toggle-mobile-nav" aria-controls="side-nav-menu" aria-expanded="false" aria-label="Abrir menú" title="Abrir menú">
            ${navIcon("menu")}
          </button>
          <div class="brand">
            <img class="brand-logo" src="${import.meta.env.BASE_URL}icon.png" alt="" />
            <span class="brand-name">Gestask</span>
          </div>
          <button type="button" class="side-nav-icon-button side-nav-collapse" data-action="toggle-sidebar" aria-expanded="${collapsed ? "false" : "true"}" aria-label="${collapseToggleLabel(collapsed)}" title="${collapseToggleLabel(collapsed)}">
            ${navIcon("sidebar")}
          </button>
        </div>
        <div class="side-nav-status">
          <div class="async-activity-slot" data-async-indicator>${AsyncActivityIndicator(getAsyncOperations())}</div>
          <div class="daily-pending-slot">${DailyPendingIndicator(dailyPending)}</div>
        </div>
        <div class="side-nav-menu" id="side-nav-menu">
          <nav class="side-nav-sections" aria-label="Navegación principal">
            ${NAV_SECTIONS.map((section) => navSection(section, activePage, context)).join("")}
          </nav>
          <div class="side-nav-footer">
            ${navItem(CONFIGURATION_ITEM, activePage, context)}
            ${ThemeToggleButton(theme)}
            ${navActionButton("refresh", "Actualizar datos", "refresh")}
            ${navActionButton("logout", "Cerrar sesión", "logout", { danger: true, detail: userEmail, title: userEmail ? `Cerrar sesión (${userEmail})` : "Cerrar sesión" })}
          </div>
        </div>
      </aside>
      <div class="side-nav-backdrop" data-action="close-mobile-nav" aria-hidden="true"></div>
      <main class="app-shell">${content}</main>
      ${Toasts(messages)}
    </div>
  `;
}

export function collapseToggleLabel(collapsed) {
  return collapsed ? "Desplegar menú" : "Plegar menú";
}

export function ThemeToggleButton(theme) {
  const option = THEME_OPTIONS[theme] ?? THEME_OPTIONS.system;
  const nextLabel = THEME_OPTIONS[option.next].label.toLowerCase();
  return navActionButton("cycle-theme", option.label, option.icon, { title: `${option.label} · pulsa para cambiar a ${nextLabel}` });
}

export function nextTheme(theme) {
  return (THEME_OPTIONS[theme] ?? THEME_OPTIONS.system).next;
}

export function pageLabel(page) {
  const items = [...NAV_SECTIONS.flatMap((section) => section.items), CONFIGURATION_ITEM];
  return items.find((item) => item.page === page)?.label ?? "";
}

function navSection(section, activePage, context) {
  return `
    <div class="side-nav-section">
      <p class="side-nav-section-title">${escapeHtml(section.title)}</p>
      ${section.items.map((item) => navItem(item, activePage, context)).join("")}
    </div>
  `;
}

function navItem(item, activePage, context) {
  const active = item.page === activePage;
  const badge = item.badge?.(context);
  const title = badge ? `${item.label} · ${badge.title}` : item.label;

  return `
    <button type="button" class="side-nav-link ${active ? "active" : ""}" data-page="${item.page}" title="${escapeHtml(title)}" ${active ? `aria-current="page"` : ""}>
      <span class="side-nav-link-icon">${navIcon(item.icon)}</span>
      <span class="side-nav-label">${escapeHtml(item.label)}</span>
      ${badge ? `<span class="side-nav-badge" aria-label="${escapeHtml(badge.title)}">${badge.count}</span>` : ""}
    </button>
  `;
}

function navActionButton(action, label, icon, { danger = false, detail = "", title = label } = {}) {
  return `
    <button type="button" class="side-nav-link ${danger ? "danger" : ""}" data-action="${action}" title="${escapeHtml(title)}">
      <span class="side-nav-link-icon">${navIcon(icon)}</span>
      ${detail ? `
        <span class="side-nav-label side-nav-label-stack">
          <span>${escapeHtml(label)}</span>
          <small class="side-nav-label-detail">${escapeHtml(detail)}</small>
        </span>
      ` : `<span class="side-nav-label">${escapeHtml(label)}</span>`}
    </button>
  `;
}

// Counts the closing steps still waiting in Completar tareas (informar PR, imputar o cerrar imputadas).
function completionBadge({ completionTasks = [] }) {
  const counts = COMPLETION_BADGE_STATUSES
    .map((status) => ({ status, count: completionTasks.filter((task) => task.pr_status === status).length }))
    .filter(({ count }) => count > 0);
  const total = counts.reduce((sum, { count }) => sum + count, 0);
  if (!total) return null;
  return { count: total, title: counts.map(({ status, count }) => `${count} ${status}`).join(", ") };
}

function navIcon(icon) {
  const icons = {
    kanban: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 4h4v12H4z" />
        <path d="M10 4h4v8h-4z" />
        <path d="M16 4h4v15h-4z" />
      </svg>
    `,
    backlog: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 6.5h16" />
        <path d="M4 12h16" />
        <path d="M4 17.5h10" />
        <path d="M7 4v5" />
        <path d="M12 9.5v5" />
        <path d="M17 15v5" />
      </svg>
    `,
    daily: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3.5 6l1 1l2-2" />
        <path d="M3.5 12l1 1l2-2" />
        <path d="M3.5 18l1 1l2-2" />
      </svg>
    `,
    dailyRoutine: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M17 2l3 3-3 3" />
        <path d="M3 11V9a4 4 0 0 1 4-4h13" />
        <path d="M7 22l-3-3 3-3" />
        <path d="M21 13v2a4 4 0 0 1-4 4H4" />
      </svg>
    `,
    completion: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 12.5l4 4L20 5" />
        <path d="M5 20h14" />
        <path d="M5 4h9" />
      </svg>
    `,
    order: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 6h12" />
        <path d="M8 12h12" />
        <path d="M8 18h12" />
        <path d="m3 9 2-2 2 2" />
        <path d="M5 7v11" />
        <path d="m3 16 2 2 2-2" />
      </svg>
    `,
    dailySchedule: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 6v6l4 2" />
        <path d="M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20Z" />
        <path d="M4 4l3 3" />
        <path d="M20 4l-3 3" />
      </svg>
    `,
    calendar: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
        <path d="M8 18h.01" />
        <path d="M12 18h.01" />
      </svg>
    `,
    time: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9 2h6" />
        <path d="M12 14l3-3" />
        <path d="M12 6a8 8 0 1 0 0 16a8 8 0 0 0 0-16Z" />
        <path d="M18.5 7.5l1.5-1.5" />
      </svg>
    `,
    charts: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16V9" />
        <path d="M12 16V6" />
        <path d="M16 16v-4" />
        <path d="M20 16V8" />
      </svg>
    `,
    configuration: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Z" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.2 2.2 0 0 1-3.1 3.1l-.05-.05A1.8 1.8 0 0 0 14.68 19a1.8 1.8 0 0 0-1.08 1.65V21a2.2 2.2 0 0 1-4.4 0v-.08A1.8 1.8 0 0 0 7.98 19a1.8 1.8 0 0 0-1.98.36l-.05.05a2.2 2.2 0 0 1-3.1-3.1l.05-.05A1.8 1.8 0 0 0 3 14.68a1.8 1.8 0 0 0-1.65-1.08H1a2.2 2.2 0 0 1 0-4.4h.08A1.8 1.8 0 0 0 3 7.98a1.8 1.8 0 0 0-.36-1.98l-.05-.05a2.2 2.2 0 0 1 3.1-3.1l.05.05A1.8 1.8 0 0 0 7.32 3a1.8 1.8 0 0 0 1.08-1.65V1a2.2 2.2 0 0 1 4.4 0v.08A1.8 1.8 0 0 0 14.02 3a1.8 1.8 0 0 0 1.98-.36l.05-.05a2.2 2.2 0 0 1 3.1 3.1l-.05.05A1.8 1.8 0 0 0 19 7.32a1.8 1.8 0 0 0 1.65 1.08H21a2.2 2.2 0 0 1 0 4.4h-.08A1.8 1.8 0 0 0 19.4 15Z" />
      </svg>
    `,
    refresh: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.5 5.5v5h-5" />
        <path d="M19.4 10.5A7.5 7.5 0 1 0 17 17.7" />
      </svg>
    `,
    logout: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    `,
    menu: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    `,
    themeSystem: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    `,
    themeLight: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.9 4.9 1.4 1.4" />
        <path d="m17.7 17.7 1.4 1.4" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.3 17.7-1.4 1.4" />
        <path d="m19.1 4.9-1.4 1.4" />
      </svg>
    `,
    themeDark: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
    `,
    sidebar: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M9 4v16" />
        <path class="side-nav-collapse-chevron" d="m16 10-2 2 2 2" />
      </svg>
    `,
  };

  return icons[icon] ?? "";
}
