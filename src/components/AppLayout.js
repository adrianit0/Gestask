export function AppLayout(activePage, content) {
  return `
    <header class="top-nav">
      <div class="brand">Gestask</div>
      <nav aria-label="Navegación principal">
        ${navButton("backlog", "Backlog", activePage, "backlog")}
        ${navButton("daily", "Tareas diarias", activePage, "daily")}
        ${navButton("dailySchedule", "Horario diario", activePage, "dailySchedule")}
        ${navButton("completion", "Completar tareas", activePage, "completion")}        
        ${navButton("calendar", "Calendario", activePage, "calendar")}
        ${navButton("time", "Gestor de tiempos", activePage, "time")}
        ${navButton("charts", "Gráficas de rendimiento", activePage, "charts")}
        <button class="nav-link icon-nav ${activePage === "configuration" ? "active" : ""}" data-page="configuration" aria-label="Configuración" title="Configuración">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Z" />
            <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.2 2.2 0 0 1-3.1 3.1l-.05-.05A1.8 1.8 0 0 0 14.68 19a1.8 1.8 0 0 0-1.08 1.65V21a2.2 2.2 0 0 1-4.4 0v-.08A1.8 1.8 0 0 0 7.98 19a1.8 1.8 0 0 0-1.98.36l-.05.05a2.2 2.2 0 0 1-3.1-3.1l.05-.05A1.8 1.8 0 0 0 3 14.68a1.8 1.8 0 0 0-1.65-1.08H1a2.2 2.2 0 0 1 0-4.4h.08A1.8 1.8 0 0 0 3 7.98a1.8 1.8 0 0 0-.36-1.98l-.05-.05a2.2 2.2 0 0 1 3.1-3.1l.05.05A1.8 1.8 0 0 0 7.32 3a1.8 1.8 0 0 0 1.08-1.65V1a2.2 2.2 0 0 1 4.4 0v.08A1.8 1.8 0 0 0 14.02 3a1.8 1.8 0 0 0 1.98-.36l.05-.05a2.2 2.2 0 0 1 3.1 3.1l-.05.05A1.8 1.8 0 0 0 19 7.32a1.8 1.8 0 0 0 1.65 1.08H21a2.2 2.2 0 0 1 0 4.4h-.08A1.8 1.8 0 0 0 19.4 15Z" />
          </svg>
        </button>
        <button class="nav-link icon-nav" data-action="refresh" aria-label="Actualizar datos" title="Actualizar datos">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20.5 5.5v5h-5" />
            <path d="M19.4 10.5A7.5 7.5 0 1 0 17 17.7" />
          </svg>
        </button>
        <button class="nav-link danger" data-action="logout">Logout</button>
      </nav>
    </header>
    <main class="app-shell">${content}</main>
  `;
}

function navButton(page, label, activePage, icon) {
  return `
    <button class="nav-link icon-nav ${page === activePage ? "active" : ""}" data-page="${page}" aria-label="${label}" title="${label}">
      ${navIcon(icon)}
    </button>
  `;
}

function navIcon(icon) {
  const icons = {
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
    completion: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 12.5l4 4L20 5" />
        <path d="M5 20h14" />
        <path d="M5 4h9" />
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
  };

  return icons[icon] ?? "";
}
