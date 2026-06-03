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
        <button class="nav-link danger" data-action="logout">Logout</button>
      </nav>
    </header>
    <main class="app-shell">${content}</main>
  `;
}

function navButton(page, label, activePage) {
  return `<button class="nav-link ${page === activePage ? "active" : ""}" data-page="${page}">${label}</button>`;
}
