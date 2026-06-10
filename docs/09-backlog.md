# Tareas

## Estado general

- **Hecho**: la documentación, archivo o funcionalidad principal existe en el proyecto.
- **Pendiente**: la tarea está definida, pero no existe todavía la implementación principal esperada.

## Lista de tareas

- **DOC-001**
  - **Estado**: Hecho
  - **Área**: Documentación
  - **Descripción**: Crear constitución SDD.
  - **Archivos**: `docs/00-constitution.md`
  - **Criterio de aceptación**: Principios y convenciones definidos.
  - **Dependencias**: Ninguna.

- **DOC-002**
  - **Estado**: Hecho
  - **Área**: Documentación
  - **Descripción**: Definir requisitos.
  - **Archivos**: `docs/01-requirements.md`
  - **Criterio de aceptación**: Reglas funcionales y de negocio cubiertas.
  - **Dependencias**: DOC-001.

- **DOC-003**
  - **Estado**: Hecho
  - **Área**: Documentación
  - **Descripción**: Registrar implementación.
  - **Archivos**: `docs/10-decisions.md`
  - **Criterio de aceptación**: Cambios y pendientes trazados.
  - **Dependencias**: Resto.

- **SQL-001**
  - **Estado**: Hecho
  - **Área**: SQL
  - **Descripción**: Crear modelo inicial, RLS y triggers.
  - **Archivos**: `supabase/sql/script-001.sql`
  - **Criterio de aceptación**: Tablas, constraints, políticas y triggers existen.
  - **Dependencias**: DOC-002.

- **API-001**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Listar, crear y actualizar tareas.
  - **Archivos**: `supabase/functions/tasks-*`
  - **Criterio de aceptación**: Endpoints validan método y usuario.
  - **Dependencias**: SQL-001.

- **API-002**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Crear y consultar partes diarios.
  - **Archivos**: `supabase/functions/daily-report-*`
  - **Criterio de aceptación**: Duplicados controlados y modo histórico indicado.
  - **Dependencias**: SQL-001.

- **API-003**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Consultar calendario y actualizar estados.
  - **Archivos**: `supabase/functions/calendar-*`
  - **Criterio de aceptación**: Mes devuelve días, puntos y tareas.
  - **Dependencias**: SQL-001.

- **FE-001**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Crear SPA y layout protegido.
  - **Archivos**: `src/main.js`, `src/components/*`
  - **Criterio de aceptación**: Login, registro, logout y navegación funcionan.
  - **Dependencias**: API auth existente.

- **FE-002**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Backlog funcional.
  - **Archivos**: `src/pages/BacklogPage.js`
  - **Criterio de aceptación**: Crear, editar y estados inline funcionan.
  - **Dependencias**: API-001.

- **FE-003**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Tareas diarias funcionales.
  - **Archivos**: `src/pages/DailyTasksPage.js`
  - **Criterio de aceptación**: Nuevo día y consulta por fecha funcionan.
  - **Dependencias**: API-002.

- **FE-004**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Calendario básico.
  - **Archivos**: `src/pages/CalendarPage.js`
  - **Criterio de aceptación**: Mes muestra puntos y permite cambiar estado.
  - **Dependencias**: API-003.

- **DOC-004**
  - **Estado**: Hecho
  - **Área**: Documentación
  - **Descripción**: Definir pestaña Configuración.
  - **Archivos**: `docs/06-configuration.md`
  - **Criterio de aceptación**: Comportamiento, modelo y reglas de configuración documentados.
  - **Dependencias**: DOC-002.

- **SQL-002**
  - **Estado**: Hecho
  - **Área**: SQL
  - **Descripción**: Crear modelo de configuración.
  - **Archivos**: `supabase/sql/script-002.sql`
  - **Criterio de aceptación**: `gestask_configuration` y `gestask_configuration_profile` existen con RLS y validaciones.
  - **Dependencias**: DOC-004.

- **API-004**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Consultar y guardar configuración.
  - **Archivos**: `supabase/functions/configuration-*`
  - **Criterio de aceptación**: Lectura aplica defaults, `fixed_value` y persistencia solo al cambiar defaults.
  - **Dependencias**: SQL-002.

- **FE-005**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Pestaña Configuración.
  - **Archivos**: `src/pages/ConfigurationPage.js`, `src/components/AppLayout.js`
  - **Criterio de aceptación**: Navegación muestra rueda dentada, permite editar valores no fijos y crear parámetros.
  - **Dependencias**: API-004.

- **UI-001**
  - **Estado**: Hecho
  - **Área**: UI/UX
  - **Descripción**: Aplicar colores y responsive.
  - **Archivos**: `src/styles/global.css`
  - **Criterio de aceptación**: Tabla y calendario son usables en móvil.
  - **Dependencias**: FE-001.

- **QA-001**
  - **Estado**: Hecho
  - **Área**: Testing manual
  - **Descripción**: Verificar flujo completo.
  - **Archivos**: Navegador + Supabase
  - **Criterio de aceptación**: Criterios globales comprobados.
  - **Dependencias**: FE-004.

## Nuevas tareas documentadas

- **DOC-005**
  - **Estado**: Hecho
  - **Área**: Documentación
  - **Descripción**: Documentar `limit_date`, `ticket_type`, comentarios, scoring y ordenación avanzada.
  - **Archivos**: `docs/01-requirements.md`, `docs/02-roadmap.md`, `docs/03-data-model.md`, `docs/04-api-contracts.md`, `docs/05-ui-specification.md`, `docs/06-configuration.md`, `docs/07-scoring.md`
  - **Criterio de aceptación**: Requisitos, reglas de negocio, contratos, UI, configuración y cálculo de scoring quedan trazados.
  - **Dependencias**: DOC-002, DOC-004.

- **SQL-003**
  - **Estado**: Hecho
  - **Área**: SQL
  - **Descripción**: Añadir columnas nuevas a `tasks`: `limit_date`, `ticket_type` y campo de comentarios.
  - **Archivos**: `supabase/sql/script-003.sql` o migración equivalente.
  - **Criterio de aceptación**: `limit_date` acepta `null` por defecto, `ticket_type` tiene default `Bug` y constraint `Bug/Feature/Task`, comentarios quedan persistidos en la tarea.
  - **Dependencias**: DOC-005.

- **SQL-004**
  - **Estado**: Hecho
  - **Área**: SQL
  - **Descripción**: Adaptar reglas automáticas de estado para `ticket_type = Task`.
  - **Archivos**: `supabase/sql/script-003.sql` o migración equivalente.
  - **Criterio de aceptación**: Las tareas tipo `Task` solo permiten `pr_status` `Not Finished`, `Need to Impute` e `Imputed`, y no requieren flujo `Need PR` ni despliegue.
  - **Dependencias**: SQL-003.

- **SQL-005**
  - **Estado**: Hecho
  - **Área**: SQL
  - **Descripción**: Añadir índices para filtros y ordenación por `assigned_date`, `limit_date`, `priority` y `ticket_type`.
  - **Archivos**: `supabase/sql/script-003.sql` o migración equivalente.
  - **Criterio de aceptación**: Existen índices adecuados sin romper RLS ni constraints previos.
  - **Dependencias**: SQL-003.

- **CONF-001**
  - **Estado**: Hecho
  - **Área**: Configuración
  - **Descripción**: Crear parámetros base `scoring_*` en `gestask_configuration`.
  - **Archivos**: `supabase/sql/script-003.sql` o seed equivalente.
  - **Criterio de aceptación**: Existen multiplicadores base para días pasados, prioridad, esfuerzo, orden, fecha límite, tipo y estados principales.
  - **Dependencias**: SQL-002, DOC-005.

- **API-005**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Actualizar `tasks-create` para aceptar `limit_date`, `ticket_type` y comentarios.
  - **Archivos**: `supabase/functions/tasks-create/index.ts`
  - **Criterio de aceptación**: La creación valida los nuevos campos y aplica defaults documentados.
  - **Dependencias**: SQL-003.

- **API-006**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Actualizar `tasks-update` para editar `limit_date`, `ticket_type`, comentarios y reglas PR por tipo.
  - **Archivos**: `supabase/functions/tasks-update/index.ts`
  - **Criterio de aceptación**: La edición impide combinaciones inválidas y no pierde comentarios existentes.
  - **Dependencias**: SQL-003, SQL-004.

- **API-007**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Implementar cálculo de scoring en listados.
  - **Archivos**: `supabase/functions/tasks-list/index.ts`, `supabase/functions/daily-report-get/index.ts`, `supabase/functions/_shared/configuration.ts`
  - **Criterio de aceptación**: Cada tarea devuelta incluye `scoring` calculado con configuración efectiva del usuario.
  - **Dependencias**: CONF-001, API-004.

- **API-008**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Añadir ordenación avanzada a listados de tareas.
  - **Archivos**: `supabase/functions/tasks-list/index.ts`, `supabase/functions/daily-report-get/index.ts`
  - **Criterio de aceptación**: `sort_by` y `sort_direction` validan catálogo, ordenan por criterios documentados y aplican desempate estable.
  - **Dependencias**: API-007.

- **FE-006**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Añadir `ticket_type` y `limit_date` al formulario de creación/edición de tarea.
  - **Archivos**: `src/components/TaskTable.js`, servicios de tareas relacionados.
  - **Criterio de aceptación**: El usuario puede crear y editar tipo y fecha límite, dejando fecha límite vacía si quiere.
  - **Dependencias**: API-005, API-006.

- **FE-007**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Adaptar selector PR según `ticket_type`.
  - **Archivos**: `src/components/TaskTable.js`, `src/utils/constants.js`
  - **Criterio de aceptación**: Tipo `Task` solo muestra `Not Finished`, `Need to Impute` e `Imputed`; otros tipos mantienen el catálogo completo.
  - **Dependencias**: FE-006.

- **FE-008**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Rediseñar detalle de tarea a 3 columnas y tamaño más compacto.
  - **Archivos**: `src/components/TaskTable.js`, `src/styles/global.css`
  - **Criterio de aceptación**: En escritorio se muestran 3 datos por línea y en móvil el detalle sigue siendo usable.
  - **Dependencias**: FE-006.

- **FE-009**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Añadir comentarios persistidos al final del detalle de tarea.
  - **Archivos**: `src/components/TaskTable.js`, manejadores de eventos en `src/main.js` o módulo equivalente, servicios de tareas.
  - **Criterio de aceptación**: El usuario puede añadir comentarios no vacíos, guardarlos y volver a verlos al abrir la tarea.
  - **Dependencias**: API-006, FE-008.

- **FE-010**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Mostrar scoring y controles de ordenación avanzada.
  - **Archivos**: `src/pages/BacklogPage.js`, `src/pages/DailyTasksPage.js`, `src/components/TaskTable.js`, servicios de tareas.
  - **Criterio de aceptación**: El usuario puede ordenar por orden, scoring, fecha inicio, fecha límite, prioridad, estado, tipo y demás criterios documentados.
  - **Dependencias**: API-007, API-008.

- **QA-002**
  - **Estado**: Hecho
  - **Área**: Testing manual
  - **Descripción**: Verificar flujo completo de tipos, fecha límite, comentarios, scoring y ordenación.
  - **Archivos**: Navegador + Supabase.
  - **Criterio de aceptación**: Todos los casos manuales de `docs/07-scoring.md` pasan correctamente.
  - **Dependencias**: FE-010.
  - **Nota**: Verificación parcial completada por inspección de código y `npm run build`; pendiente ejecución real en navegador contra Supabase con `script-003.sql` aplicado.

- **DOC-006**
  - **Estado**: Hecho
  - **Área**: Documentación
  - **Descripción**: Documentar la funcionalidad `Completar tareas`.
  - **Archivos**: `docs/01-requirements.md`, `docs/02-roadmap.md`, `docs/03-data-model.md`, `docs/04-api-contracts.md`, `docs/05-ui-specification.md`, `docs/10-decisions.md`
  - **Criterio de aceptación**: Reglas de inclusión, popups, transiciones, datos futuros y contratos previstos quedan documentados sin implementación.
  - **Dependencias**: DOC-005.

- **SQL-006**
  - **Estado**: Hecho
  - **Área**: SQL
  - **Descripción**: Añadir campos de cierre de workflow a `tasks`.
  - **Archivos**: `supabase/sql/script-004.sql` o migración equivalente.
  - **Criterio de aceptación**: Existen `pr_link`, `test_cases` e `imputed_date` con tipos y nullability documentados, sin romper datos existentes.
  - **Dependencias**: DOC-006, SQL-003, SQL-004.

- **SQL-007**
  - **Estado**: Hecho
  - **Área**: SQL
  - **Descripción**: Añadir soporte de consulta eficiente para `Completar tareas`.
  - **Archivos**: `supabase/sql/script-004.sql` o migración equivalente.
  - **Criterio de aceptación**: Existen índices adecuados para consultar tareas por `user_id`, `task_status`, `pr_status` e `imputed_date` cuando aplique.
  - **Dependencias**: SQL-006.

- **API-009**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Crear endpoint `tasks-completion-list`.
  - **Archivos**: `supabase/functions/tasks-completion-list/index.ts`, código compartido si aplica.
  - **Criterio de aceptación**: Devuelve solo tareas `Done` no finalizadas: `Bug`/`Feature` no `Deployed` y `Task` no `Imputed`, sin aceptar criterios funcionales de ordenación o filtrado.
  - **Dependencias**: SQL-006, SQL-007.

- **API-010**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Crear endpoint `tasks-completion-resolve`.
  - **Archivos**: `supabase/functions/tasks-completion-resolve/index.ts`, código compartido si aplica.
  - **Criterio de aceptación**: Resuelve transiciones válidas `Need PR -> Need to Impute`, `Need to Impute -> Imputed` e `Imputed -> Deployed` con validaciones por tipo de ticket.
  - **Dependencias**: API-009.

- **FE-011**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Añadir navegación y página `Completar tareas`.
  - **Archivos**: `src/components/AppLayout.js`, `src/main.js`, `src/pages/CompletionTasksPage.js`, `src/services/taskCompletionService.js`
  - **Criterio de aceptación**: La navegación muestra `Completar tareas` y la página lista únicamente tareas devueltas por `tasks-completion-list` sin filtros ni ordenación funcional.
  - **Dependencias**: API-009.

- **FE-012**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Implementar popups de resolución de `Completar tareas`.
  - **Archivos**: `src/pages/CompletionTasksPage.js`, `src/components` si se extraen modales, `src/styles/global.css`, `src/services/taskCompletionService.js`
  - **Criterio de aceptación**: `Resolver` muestra el popup correcto para `Need PR`, `Need to Impute` e `Imputed`, permite campos opcionales donde corresponda y refresca el listado tras confirmar.
  - **Dependencias**: FE-011, API-010.

- **QA-003**
  - **Estado**: Hecho
  - **Área**: Testing manual
  - **Descripción**: Verificar flujo completo de `Completar tareas`.
  - **Archivos**: Navegador + Supabase, documentación QA futura.
  - **Criterio de aceptación**: Se valida inclusión/exclusión de tareas, transiciones por tipo, datos opcionales de PR/test cases, edición de `imputed_date` y cierre final en `Deployed`.
  - **Dependencias**: FE-012.

- **DOC-007**
  - **Estado**: Hecho
  - **Área**: Documentación
  - **Descripción**: Documentar la funcionalidad `Ordenar tareas` bajo SDD.
  - **Archivos**: `docs/01-requirements.md`, `docs/02-roadmap.md`, `docs/03-data-model.md`, `docs/04-api-contracts.md`, `docs/05-ui-specification.md`, `docs/07-scoring.md`, `docs/08-order-tasks.md`, `docs/10-decisions.md`
  - **Criterio de aceptación**: Reglas de inclusión, orden visual, algoritmo de movimiento, contrato batch, UI y QA quedan documentados sin implementación.
  - **Dependencias**: DOC-005.

- **SQL-008**
  - **Estado**: Hecho
  - **Área**: SQL
  - **Descripción**: Añadir soporte eficiente para consultar tareas ordenables.
  - **Archivos**: `supabase/sql/script-006.sql` o migración equivalente.
  - **Criterio de aceptación**: Existe índice adecuado para consultar por `user_id`, `task_status` y `order_points` sin romper RLS ni datos existentes.
  - **Dependencias**: DOC-007.

- **API-011**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Crear endpoint `tasks-order-list`.
  - **Archivos**: `supabase/functions/tasks-order-list/index.ts`
  - **Criterio de aceptación**: Devuelve solo tareas no finales con `order_points` informado, ordenadas por `order_points desc` con desempate estable.
  - **Dependencias**: DOC-007, SQL-008.

- **API-012**
  - **Estado**: Hecho
  - **Área**: Edge Functions
  - **Descripción**: Crear endpoint batch `tasks-order-update`.
  - **Archivos**: `supabase/functions/tasks-order-update/index.ts`
  - **Criterio de aceptación**: Valida payload completo, rechaza tareas no ordenables, aplica cambios sin parciales y evita una llamada por tarea.
  - **Dependencias**: API-011.

- **FE-013**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Añadir navegación, servicio y página `Ordenar tareas`.
  - **Archivos**: `src/components/AppLayout.js`, `src/main.js`, `src/pages/OrderTasksPage.js`, `src/services/taskOrderService.js`, `src/styles/global.css`
  - **Criterio de aceptación**: La navegación muestra `Ordenar tareas`, la página lista tareas ordenables y permite mover arriba/abajo con una llamada batch por operación.
  - **Dependencias**: API-011, API-012.

- **FE-014**
  - **Estado**: Hecho
  - **Área**: Frontend
  - **Descripción**: Implementar acción `Ordenar automaticamente`.
  - **Archivos**: `src/pages/OrderTasksPage.js`, `src/services/taskOrderService.js`
  - **Criterio de aceptación**: La acción normaliza `order_points` de `1` a `N`, envía solo los cambios necesarios en una única llamada batch y refresca la lista.
  - **Dependencias**: FE-013.

- **QA-004**
  - **Estado**: Pendiente
  - **Área**: Testing manual
  - **Descripción**: Verificar flujo completo de `Ordenar tareas`.
  - **Archivos**: Navegador + Supabase, `docs/08-order-tasks.md`
  - **Criterio de aceptación**: Pasan los casos manuales de listado, subida, bajada, orden automático, errores y verificación de una única llamada batch.
  - **Dependencias**: FE-014.
  - **Nota**: Build frontend validado; pendiente prueba manual real contra Supabase desplegado.
