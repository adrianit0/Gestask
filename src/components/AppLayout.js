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
