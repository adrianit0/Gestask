# Decisiones técnicas

## SQL añadido
- `supabase/sql/script-001.sql`: tablas, constraints, RLS, triggers de actualización y sincronización con parte diario.
- `supabase/sql/script-002.sql`: modelo de configuración.
- `supabase/sql/script-003.sql`: columnas `limit_date`, `ticket_type` y `comments` en `tasks`, con defaults, constraints básicos, reglas PR específicas para `ticket_type = Task`, índices de filtro/ordenación y parámetros base `scoring_*`.
- `supabase/sql/script-004.sql`: columnas opcionales `pr_link`, `test_cases` e `imputed_date`, más índices de consulta para soportar `Completar tareas`.
- `supabase/sql/script-005.sql`: migración de estado PR `Need to Impute`, sustitución de `PR Hecho` y ajuste de `Task` para requerir confirmación de imputación.

## Edge Functions creadas o modificadas
- `tasks-list`, `tasks-create`, `tasks-update`.
- `daily-report-create`, `daily-report-get`.
- `calendar-month-get`, `calendar-day-status-update`.
- `configuration-list`, `configuration-profile-update`, `configuration-create`.
- `tasks-create` actualizado para `ticket_type`, `limit_date` y `comments`.
- `tasks-update` actualizado para `ticket_type`, `limit_date`, comentarios y reglas PR por tipo.
- `tasks-list` y `daily-report-get` actualizados para devolver `scoring` calculado y aceptar `sort_by`/`sort_direction`.
- `tasks-completion-list`: lista tareas `Done` pendientes de cierre.
- `tasks-completion-resolve`: avanza transiciones de cierre `Need PR`, `Need to Impute` e `Imputed`.
- `tasks-order-list`, `tasks-order-update`: listado y actualización batch para `Ordenar tareas`.
- `supabase/functions/_shared/configuration.ts`: validación de configuración y cálculo de scoring.
- `supabase/functions/_shared/taskSorting.ts`: validación y ordenación estable de tareas.

## Frontend añadido
- `src/pages/TimeManagerPage.js`: alta, edición, borrado e historial de registros horarios.
- `src/pages/PerformancePage.js`: métricas de tareas y visualizaciones básicas de rendimiento.
- `src/pages/ConfigurationPage.js`: edición y creación de parámetros de configuración.
- `src/pages/CompletionTasksPage.js`, `src/services/taskCompletionService.js`: navegación, listado y popups de `Completar tareas`.
- `src/pages/OrderTasksPage.js`, `src/services/taskOrderService.js`: pestaña `Ordenar tareas` con acciones subir, bajar y `Ordenar automaticamente`.
- `src/components/TaskTable.js`: formulario y detalle compacto (3 columnas), selector PR por tipo, comentarios persistidos.
- `src/services/timeEntryService.js`: persistencia local de registros horarios en `localStorage`.

## Decisiones técnicas
- SPA con Vite y JavaScript sin framework para mantener una primera versión simple.
- Servicios HTTP centralizados en `src/services`.
- Sesión guardada en `localStorage` porque las funciones de auth devuelven sesión Supabase y el cliente necesita enviar `Authorization: Bearer`.
- Reglas críticas de estado implementadas en SQL y reforzadas en Edge Functions.
- El scoring se documenta como campo calculado, no necesariamente persistido, para evitar desincronización con cambios de configuración.
- `limit_date` se define nullable para no bloquear el flujo actual de creación de tareas.
- `ticket_type = Task` se separa del flujo PR porque su estado final esperado es `Imputed`, no despliegue.
- `Ordenar tareas` se especifica como operación batch para evitar una actualización HTTP por tarea y mantener consistencia de orden manual.

## Pendiente
- Conectar y desplegar contra un proyecto Supabase real.
- Añadir tests automatizados.
- Mejorar accesibilidad avanzada de tablas grandes.
- Validar Edge Functions con `supabase functions serve` o despliegue real cuando Supabase CLI esté configurado.
- Ejecutar QA-002 y QA-004 en navegador contra Supabase real (ver `docs/09-backlog.md`).
