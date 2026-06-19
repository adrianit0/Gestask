# Decisiones técnicas

## SQL añadido
- `supabase/sql/script-001.sql`: tablas, constraints, RLS, triggers de actualización y sincronización con parte diario.
- `supabase/sql/script-002.sql`: modelo de configuración.
- `supabase/sql/script-003.sql`: columnas `limit_date`, `ticket_type` y `comments` en `tasks`, con defaults, constraints básicos, reglas PR específicas para `ticket_type = Task`, índices de filtro/ordenación y parámetros base `scoring_*`.
- `supabase/sql/script-004.sql`: columnas opcionales `pr_link`, `test_cases` e `imputed_date`, más índices de consulta para soportar `Completar tareas`.
- `supabase/sql/script-005.sql`: migración de estado PR `Need to Impute`, sustitución de `PR Hecho` y ajuste de `Task` para requerir confirmación de imputación.
- `supabase/sql/script-009.sql`: parámetro `PE_diario_extra` (`number`, defecto `3`) para las horas extra del horario diario.

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
- `src/pages/DailySchedulePage.js`, `src/utils/dailySchedule.js`: horario diario con botón para incluir/ocultar horas extra basado en `PE_diario_extra`.

## Decisiones técnicas
- SPA con Vite y JavaScript sin framework para mantener una primera versión simple.
- Servicios HTTP centralizados en `src/services`.
- Sesión guardada en `localStorage` porque las funciones de auth devuelven sesión Supabase y el cliente necesita enviar `Authorization: Bearer`.
- Reglas críticas de estado implementadas en SQL y reforzadas en Edge Functions.
- El scoring se documenta como campo calculado, no necesariamente persistido, para evitar desincronización con cambios de configuración.
- `limit_date` se define nullable para no bloquear el flujo actual de creación de tareas.
- `ticket_type = Task` se separa del flujo PR porque su estado final esperado es `Imputed`, no despliegue.
- `Ordenar tareas` se especifica como operación batch para evitar una actualización HTTP por tarea y mantener consistencia de orden manual.
- La inclusión de horas extra del `Horario diario` se modela como estado de UI no persistido: amplía la hora de fin efectiva en `PE_diario_extra * Minute_PE` minutos sin alterar la jornada configurada.
- Las gráficas de `Rendimiento` excluyen las tareas `Undone` y `Unfinished` mediante un filtro común aplicado antes de calcular cualquier serie basada en tareas, para que no contaminen tareas nuevas, creadas ni puntos de esfuerzo.
- Las gráficas de `Rendimiento` se agrupan en cuatro bloques diferenciados (`Rendimiento de puntos`, `Rendimiento de tareas`, `Rendimiento acumulado`, `Distribución y resumen`) seleccionables desde un menú lateral izquierdo; el grupo activo se modela como estado de UI no persistido (`performanceChartGroup`, por defecto `points`).
- Se corrige la inconsistencia de las gráficas acumuladas: `Ritmo acumulado creado del mes` acumula puntos nuevos/creados (antes acumulaba completados pese a la etiqueta) y se añade `Ritmo terminado acumulado del mes` para el acumulado de completados, dejando coherentes las tres series del grupo acumulado.
- `Estados de tarea` y `Prioridad` permanecen siempre visibles encima del menú de grupos (no se mueven a ningún grupo) y se mantienen como barras horizontales por ser distribuciones categóricas.
- Las gráficas de diferencia (`Diferencia entre nuevas y terminadas`, puntos y tareas) y las tres del grupo `Rendimiento acumulado` se representan como gráfica de línea SVG con línea base en 0; el resto de series diarias siguen como barras verticales.
- Convenio de signo en gráficas comparativas (diferencias diarias y grupo acumulado): completado/terminado = positivo, nuevo/creado = negativo. La diferencia diaria se calcula como `terminadas − nuevas` y el acumulado creado se dibuja en negativo. No aplica a las gráficas que solo muestran creados (`Puntos nuevos este mes`, `Tareas creadas por día`).

## Pendiente
- Conectar y desplegar contra un proyecto Supabase real.
- Añadir tests automatizados.
- Mejorar accesibilidad avanzada de tablas grandes.
- Validar Edge Functions con `supabase functions serve` o despliegue real cuando Supabase CLI esté configurado.
- Ejecutar QA-002 y QA-004 en navegador contra Supabase real (ver `docs/10-backlog.md`).
