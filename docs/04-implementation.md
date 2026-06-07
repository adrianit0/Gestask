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
- Documentación funcional y técnica para la funcionalidad futura `Completar tareas`; no está implementada.
- Verificación parcial de QA-002 documentada en `docs/10-qa-002.md`.
- Build de frontend verificado con `npm.cmd run build` en una iteración previa.

## Archivos creados o modificados
- `package.json`, `index.html`, `.env.example`, `.gitignore`.
- `src/**`.
- `supabase/sql/script-001.sql`.
- `supabase/sql/script-002.sql`.
- `supabase/sql/script-003.sql`.
- `supabase/functions/**`.
- `docs/**`.

## SQL añadido
- `supabase/sql/script-001.sql`: tablas, constraints, RLS, triggers de actualización y sincronización con parte diario.
- `supabase/sql/script-002.sql`: modelo de configuración.
- `supabase/sql/script-003.sql`: columnas `limit_date`, `ticket_type` y `comments` en `tasks`, con defaults, constraints básicos, reglas PR específicas para `ticket_type = Task`, índices de filtro/ordenación y parámetros base `scoring_*`.
- `supabase/sql/script-004.sql`: columnas opcionales `pr_link`, `test_cases` e `imputed_date`, más índices de consulta para soportar `Completar tareas`.

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
- `tasks-create` actualizado para `ticket_type`, `limit_date` y `comments`.
- `tasks-update` actualizado para `ticket_type`, `limit_date`, comentarios y reglas PR por tipo.
- `tasks-list` y `daily-report-get` actualizados para devolver `scoring` calculado.
- `tasks-list` y `daily-report-get` actualizados para validar y aplicar `sort_by` y `sort_direction`.
- `tasks-completion-list` creado para listar tareas `Done` pendientes de cierre en `Completar tareas`.
- `tasks-completion-resolve` creado para avanzar transiciones de cierre `Need PR`, `PR Hecho` e `Imputed`.

## Frontend añadido
- `src/pages/TimeManagerPage.js`: alta, edición, borrado e historial de registros horarios.
- `src/pages/PerformancePage.js`: métricas de tareas y visualizaciones básicas de rendimiento.
- `src/pages/ConfigurationPage.js`: edición y creación de parámetros de configuración.
- `src/components/TaskTable.js`: formulario de tarea con `ticket_type` y `limit_date`.
- `src/components/TaskTable.js`: selector PR adaptado a `ticket_type = Task`.
- `src/components/TaskTable.js` y `src/styles/global.css`: detalle de tarea compacto con 3 columnas en escritorio.
- `src/components/TaskTable.js`, `src/main.js` y `src/styles/global.css`: comentarios persistidos desde el detalle de tarea.
- `src/pages/BacklogPage.js`, `src/pages/DailyTasksPage.js`, `src/components/TaskTable.js` y servicios de tareas/partes: scoring visible y ordenación avanzada en UI.
- `src/pages/CompletionTasksPage.js`, `src/services/taskCompletionService.js`, `src/components/AppLayout.js`, `src/main.js` y `src/styles/global.css`: navegación, listado y popups de resolución de `Completar tareas`.
- `src/services/timeEntryService.js`: persistencia local de registros horarios en `localStorage`.
- `supabase/functions/_shared/configuration.ts`: validación de configuración y cálculo compartido de scoring.
- `supabase/functions/_shared/taskSorting.ts`: validación y ordenación estable de tareas.

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
- Implementar ordenación avanzada en UI.
- Completar validación manual del flujo de scoring y ordenación.
- Ejecutar QA-002 en navegador contra Supabase real y cerrar la tarea cuando todos los casos pasen.
- Añadir comentarios persistidos desde el detalle de tarea.
- Implementar `Completar tareas` cuando se autorice el desarrollo.
