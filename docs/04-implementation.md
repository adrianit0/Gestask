# Implementación

## Implementado
- Estructura base Vite JavaScript.
- Documentación SDD inicial.
- Modelo SQL inicial en `script-001.sql`.
- Edge Functions para tareas, partes diarios y calendario.
- Frontend SPA con login/registro, navegación fija, backlog, tareas diarias, calendario, gestor de tiempos y gráficas de rendimiento.
- Gestor de tiempos con registros horarios locales vinculados a tareas del backlog.
- Gráficas de rendimiento con KPIs, distribución por estado/prioridad y puntos completados del mes.
- Pestaña Configuración con catálogo global y valores por usuario.
- Documentación funcional y técnica para `limit_date`, `ticket_type`, comentarios, scoring configurable y ordenación avanzada.
- Build de frontend verificado con `npm.cmd run build` en una iteración previa.

## Archivos creados o modificados
- `package.json`, `index.html`, `.env.example`, `.gitignore`.
- `src/**`.
- `supabase/sql/script-001.sql`.
- `supabase/sql/script-002.sql`.
- `supabase/functions/**`.
- `docs/**`.

## SQL añadido
- `supabase/sql/script-001.sql`: tablas, constraints, RLS, triggers de actualización y sincronización con parte diario.
- `supabase/sql/script-002.sql`: modelo de configuración.

## Edge Functions creadas
- `tasks-list`.
- `tasks-create`.
- `tasks-update`.
- `daily-report-create`.
- `daily-report-get`.
- `calendar-month-get`.
- `calendar-day-status-update`.
- `configuration-list`.
- `configuration-profile-update`.
- `configuration-create`.

## Frontend añadido
- `src/pages/TimeManagerPage.js`: alta, edición, borrado e historial de registros horarios.
- `src/pages/PerformancePage.js`: métricas de tareas y visualizaciones básicas de rendimiento.
- `src/pages/ConfigurationPage.js`: edición y creación de parámetros de configuración.
- `src/services/timeEntryService.js`: persistencia local de registros horarios en `localStorage`.

## Decisiones técnicas
- SPA con Vite y JavaScript sin framework para mantener una primera versión simple.
- Servicios HTTP centralizados en `src/services`.
- Sesión guardada en `localStorage` porque las funciones de auth devuelven sesión Supabase y el cliente necesita enviar `Authorization: Bearer`.
- Reglas críticas de estado implementadas en SQL y reforzadas en Edge Functions.
- El scoring se documenta como campo calculado, no necesariamente persistido, para evitar desincronización con cambios de configuración.
- La fecha límite `limit_date` se define nullable para no bloquear el flujo actual de creación de tareas.
- `ticket_type = Task` se separa del flujo PR porque su estado final esperado es `Imputed`, no despliegue.

## Pendiente
- Conectar y desplegar contra un proyecto Supabase real.
- Añadir tests automatizados.
- Mejorar accesibilidad avanzada de tablas grandes.
- Validar Edge Functions con `supabase functions serve` o despliegue real cuando Supabase CLI esté configurado.
- Implementar migración SQL para `limit_date`, `ticket_type`, comentarios, constraints e índices.
- Crear parámetros base `scoring_*`.
- Implementar cálculo de scoring en API.
- Implementar ordenación avanzada en API y UI.
- Adaptar formularios, tablas y detalle de tarea.
- Añadir comentarios persistidos desde el detalle de tarea.
