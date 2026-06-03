# Implementación

## Implementado
- Estructura base Vite JavaScript.
- Documentación SDD inicial.
- Modelo SQL inicial en `script-001.sql`.
- Edge Functions para tareas, partes diarios y calendario.
- Frontend SPA con login/registro, navegación fija, backlog, tareas diarias, calendario, gestor de tiempos y gráficas de rendimiento.
- Gestor de tiempos con registros horarios locales vinculados a tareas del backlog.
- Gráficas de rendimiento con KPIs, distribución por estado/prioridad y puntos completados del mes.
- Build de frontend verificado con `npm.cmd run build`.

## Archivos creados o modificados
- `package.json`, `index.html`, `.env.example`, `.gitignore`.
- `src/**`.
- `supabase/sql/script-001.sql`.
- `supabase/functions/**`.
- `docs/**`.

## SQL añadido
- `supabase/sql/script-001.sql`: tablas, constraints, RLS, triggers de actualización y sincronización con parte diario.

## Edge Functions creadas
- `tasks-list`.
- `tasks-create`.
- `tasks-update`.
- `daily-report-create`.
- `daily-report-get`.
- `calendar-month-get`.
- `calendar-day-status-update`.

## Frontend añadido
- `src/pages/TimeManagerPage.js`: alta, edición, borrado e historial de registros horarios.
- `src/pages/PerformancePage.js`: métricas de tareas y visualizaciones básicas de rendimiento.
- `src/services/timeEntryService.js`: persistencia local de registros horarios en `localStorage`.

## Decisiones técnicas
- SPA con Vite y JavaScript sin framework para mantener una primera versión simple.
- Servicios HTTP centralizados en `src/services`.
- Sesión guardada en `localStorage` porque las funciones de auth devuelven sesión Supabase y el cliente necesita enviar `Authorization: Bearer`.
- Reglas críticas de estado implementadas en SQL y reforzadas en Edge Functions.

## Pendiente
- Conectar y desplegar contra un proyecto Supabase real.
- Añadir tests automatizados.
- Mejorar accesibilidad avanzada de tablas grandes.
- Validar Edge Functions con `supabase functions serve` o despliegue real cuando Supabase CLI esté configurado.
