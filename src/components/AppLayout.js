export function AppLayout(activePage, content) {
  return `
    <header class="top-nav">
      <div class="brand">Gestask</div>
      <nav aria-label="Navegación principal">
        ${navButton("backlog", "Backlog", activePage)}
        ${navButton("daily", "Tareas Diarias", activePage)}
        ${navButton("calendar", "Calendario", activePage)}
        ${navButton("time", "Gestor de Tiempos", activePage)}
        ${navButton("charts", "Gráficas de Rendimiento", activePage)}
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

function navButton(page, label, activePage) {
  return `<button class="nav-link ${page === activePage ? "active" : ""}" data-page="${page}">${label}</button>`;
}
