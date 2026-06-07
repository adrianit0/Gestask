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
  - **Archivos**: `docs/04-implementation.md`
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
  - **Archivos**: `docs/08-configuration.md`
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
  - **Estado**: Pendiente
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
  - **Archivos**: `docs/01-requirements.md`, `docs/02-roadmap.md`, `docs/05-data-model.md`, `docs/06-api-contracts.md`, `docs/07-ui-specification.md`, `docs/08-configuration.md`, `docs/09-scoring-and-ordering.md`
  - **Criterio de aceptación**: Requisitos, reglas de negocio, contratos, UI, configuración y cálculo de scoring quedan trazados.
  - **Dependencias**: DOC-002, DOC-004.

- **SQL-003**
  - **Estado**: Pendiente
  - **Área**: SQL
  - **Descripción**: Añadir columnas nuevas a `tasks`: `limit_date`, `ticket_type` y campo de comentarios.
  - **Archivos**: `supabase/sql/script-003.sql` o migración equivalente.
  - **Criterio de aceptación**: `limit_date` acepta `null` por defecto, `ticket_type` tiene default `Bug` y constraint `Bug/Feature/Task`, comentarios quedan persistidos en la tarea.
  - **Dependencias**: DOC-005.

- **SQL-004**
  - **Estado**: Pendiente
  - **Área**: SQL
  - **Descripción**: Adaptar reglas automáticas de estado para `ticket_type = Task`.
  - **Archivos**: `supabase/sql/script-003.sql` o migración equivalente.
  - **Criterio de aceptación**: Las tareas tipo `Task` solo permiten `pr_status` `Not Finished` e `Imputed`, y no requieren flujo `Need PR`.
  - **Dependencias**: SQL-003.

- **SQL-005**
  - **Estado**: Pendiente
  - **Área**: SQL
  - **Descripción**: Añadir índices para filtros y ordenación por `assigned_date`, `limit_date`, `priority` y `ticket_type`.
  - **Archivos**: `supabase/sql/script-003.sql` o migración equivalente.
  - **Criterio de aceptación**: Existen índices adecuados sin romper RLS ni constraints previos.
  - **Dependencias**: SQL-003.

- **CONF-001**
  - **Estado**: Pendiente
  - **Área**: Configuración
  - **Descripción**: Crear parámetros base `scoring_*` en `gestask_configuration`.
  - **Archivos**: `supabase/sql/script-003.sql` o seed equivalente.
  - **Criterio de aceptación**: Existen multiplicadores base para días pasados, prioridad, esfuerzo, orden, fecha límite, tipo y estados principales.
  - **Dependencias**: SQL-002, DOC-005.

- **API-005**
  - **Estado**: Pendiente
  - **Área**: Edge Functions
  - **Descripción**: Actualizar `tasks-create` para aceptar `limit_date`, `ticket_type` y comentarios.
  - **Archivos**: `supabase/functions/tasks-create/index.ts`
  - **Criterio de aceptación**: La creación valida los nuevos campos y aplica defaults documentados.
  - **Dependencias**: SQL-003.

- **API-006**
  - **Estado**: Pendiente
  - **Área**: Edge Functions
  - **Descripción**: Actualizar `tasks-update` para editar `limit_date`, `ticket_type`, comentarios y reglas PR por tipo.
  - **Archivos**: `supabase/functions/tasks-update/index.ts`
  - **Criterio de aceptación**: La edición impide combinaciones inválidas y no pierde comentarios existentes.
  - **Dependencias**: SQL-003, SQL-004.

- **API-007**
  - **Estado**: Pendiente
  - **Área**: Edge Functions
  - **Descripción**: Implementar cálculo de scoring en listados.
  - **Archivos**: `supabase/functions/tasks-list/index.ts`, `supabase/functions/daily-report-get/index.ts`, `supabase/functions/_shared/configuration.ts`
  - **Criterio de aceptación**: Cada tarea devuelta incluye `scoring` calculado con configuración efectiva del usuario.
  - **Dependencias**: CONF-001, API-004.

- **API-008**
  - **Estado**: Pendiente
  - **Área**: Edge Functions
  - **Descripción**: Añadir ordenación avanzada a listados de tareas.
  - **Archivos**: `supabase/functions/tasks-list/index.ts`, `supabase/functions/daily-report-get/index.ts`
  - **Criterio de aceptación**: `sort_by` y `sort_direction` validan catálogo, ordenan por criterios documentados y aplican desempate estable.
  - **Dependencias**: API-007.

- **FE-006**
  - **Estado**: Pendiente
  - **Área**: Frontend
  - **Descripción**: Añadir `ticket_type` y `limit_date` al formulario de creación/edición de tarea.
  - **Archivos**: `src/components/TaskTable.js`, servicios de tareas relacionados.
  - **Criterio de aceptación**: El usuario puede crear y editar tipo y fecha límite, dejando fecha límite vacía si quiere.
  - **Dependencias**: API-005, API-006.

- **FE-007**
  - **Estado**: Pendiente
  - **Área**: Frontend
  - **Descripción**: Adaptar selector PR según `ticket_type`.
  - **Archivos**: `src/components/TaskTable.js`, `src/utils/constants.js`
  - **Criterio de aceptación**: Tipo `Task` solo muestra `Not Finished` e `Imputed`; otros tipos mantienen el catálogo completo.
  - **Dependencias**: FE-006.

- **FE-008**
  - **Estado**: Pendiente
  - **Área**: Frontend
  - **Descripción**: Rediseñar detalle de tarea a 3 columnas y tamaño más compacto.
  - **Archivos**: `src/components/TaskTable.js`, `src/styles/global.css`
  - **Criterio de aceptación**: En escritorio se muestran 3 datos por línea y en móvil el detalle sigue siendo usable.
  - **Dependencias**: FE-006.

- **FE-009**
  - **Estado**: Pendiente
  - **Área**: Frontend
  - **Descripción**: Añadir comentarios persistidos al final del detalle de tarea.
  - **Archivos**: `src/components/TaskTable.js`, manejadores de eventos en `src/main.js` o módulo equivalente, servicios de tareas.
  - **Criterio de aceptación**: El usuario puede añadir comentarios no vacíos, guardarlos y volver a verlos al abrir la tarea.
  - **Dependencias**: API-006, FE-008.

- **FE-010**
  - **Estado**: Pendiente
  - **Área**: Frontend
  - **Descripción**: Mostrar scoring y controles de ordenación avanzada.
  - **Archivos**: `src/pages/BacklogPage.js`, `src/pages/DailyTasksPage.js`, `src/components/TaskTable.js`, servicios de tareas.
  - **Criterio de aceptación**: El usuario puede ordenar por orden, scoring, fecha inicio, fecha límite, prioridad, estado, tipo y demás criterios documentados.
  - **Dependencias**: API-007, API-008.

- **QA-002**
  - **Estado**: Pendiente
  - **Área**: Testing manual
  - **Descripción**: Verificar flujo completo de tipos, fecha límite, comentarios, scoring y ordenación.
  - **Archivos**: Navegador + Supabase
  - **Criterio de aceptación**: Todos los casos manuales de `docs/09-scoring-and-ordering.md` pasan correctamente.
  - **Dependencias**: FE-010.
