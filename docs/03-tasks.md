# Tareas

## Estado general

- **Hecho**: la documentación, archivo o funcionalidad principal existe en el proyecto.
- **Pendiente**: la tarea está definida, pero no existe todavía la implementación principal esperada.
- **Bloqueada**: depende de una tarea pendiente antes de poder completarse correctamente.

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
  - **Estado**: Bloqueada
  - **Área**: Edge Functions
  - **Descripción**: Consultar y guardar configuración.
  - **Archivos**: `supabase/functions/configuration-*`
  - **Criterio de aceptación**: Lectura aplica defaults, `fixed_value` y persistencia solo al cambiar defaults.
  - **Dependencias**: SQL-002.

- **FE-005**
  - **Estado**: Bloqueada
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
