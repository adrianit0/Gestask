# Tareas

| ID | Área | Descripción | Archivos | Criterio de aceptación | Dependencias |
|---|---|---|---|---|---|
| DOC-001 | Documentación | Crear constitución SDD | `docs/00-constitution.md` | Principios y convenciones definidos | Ninguna |
| DOC-002 | Documentación | Definir requisitos | `docs/01-requirements.md` | Reglas funcionales y de negocio cubiertas | DOC-001 |
| DOC-003 | Documentación | Registrar implementación | `docs/04-implementation.md` | Cambios y pendientes trazados | Resto |
| SQL-001 | SQL | Crear modelo inicial, RLS y triggers | `supabase/sql/script-001.sql` | Tablas, constraints, políticas y triggers existen | DOC-002 |
| API-001 | Edge Functions | Listar, crear y actualizar tareas | `supabase/functions/tasks-*` | Endpoints validan método y usuario | SQL-001 |
| API-002 | Edge Functions | Crear y consultar partes diarios | `supabase/functions/daily-report-*` | Duplicados controlados y modo histórico indicado | SQL-001 |
| API-003 | Edge Functions | Consultar calendario y actualizar estados | `supabase/functions/calendar-*` | Mes devuelve días, puntos y tareas | SQL-001 |
| FE-001 | Frontend | Crear SPA y layout protegido | `src/main.js`, `src/components/*` | Login, registro, logout y navegación funcionan | API auth existente |
| FE-002 | Frontend | Backlog funcional | `src/pages/BacklogPage.js` | Crear, editar y estados inline funcionan | API-001 |
| FE-003 | Frontend | Tareas diarias funcionales | `src/pages/DailyTasksPage.js` | Nuevo día y consulta por fecha funcionan | API-002 |
| FE-004 | Frontend | Calendario básico | `src/pages/CalendarPage.js` | Mes muestra puntos y permite cambiar estado | API-003 |
| UI-001 | UI/UX | Aplicar colores y responsive | `src/styles/global.css` | Tabla y calendario son usables en móvil | FE-001 |
| QA-001 | Testing manual | Verificar flujo completo | Navegador + Supabase | Criterios globales comprobados | FE-004 |
