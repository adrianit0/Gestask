# Tareas diarias (tipo `Diaria`)

## Objetivo
El tipo de tarea `Diaria` representa tareas recurrentes y cortas que deben realizarse obligatoriamente **cada día en que se crea un parte diario**, mientras la tarea no tenga fecha de finalización (`finished_date`).

Las tareas diarias no se mezclan con el resto de tareas: tienen su propio espacio (pestaña `Diarias`), aparecen arriba del todo en `Horario diario` y el número de diarias sin realizar se muestra en la cabecera.

## Modelo
| Elemento | Regla |
|---|---|
| `tasks.ticket_type` | Nuevo valor de catálogo `Diaria`. |
| `tasks.effort_points` | Siempre `0`: las diarias no tienen PE. |
| `tasks.order_points` | Siempre `null`: las diarias no tienen PO. |
| `tasks.pr_status` | Siempre `Not Finished`: no tienen workflow PR ni imputación. |
| `tasks.task_status` | Solo `To do` (activa) o `Done` (finalizada). |
| `tasks.finished_date` | Fecha fin de la recurrencia. Se rellena al pasar a `Done` y se vacía al reactivar. |
| `daily_report_tasks.completed_at` | Marca de realización de la diaria en ese parte (`null` = sin realizar). |

Las reglas anteriores se garantizan en SQL (`normalize_task_state` y constraint `tasks_daily_rules_check`, `supabase/sql/script-011.sql`) y se refuerzan en `tasks-create`/`tasks-update`.

Una tarea no puede cambiar de tipo desde o hacia `Diaria` (`Daily ticket type cannot be changed.`), para no romper su historial por parte diario.

## Reglas de obligatoriedad
- Al crear un parte diario (`daily-report-create`) se añaden todas las tareas `Diaria` del usuario con `finished_date` nulo, además de las tareas normales válidas.
- Si el parte de hoy ya existe, al crear o reactivar una diaria se añade automáticamente a ese parte (trigger `sync_task_with_today_report`).
- Una diaria está **pendiente** en un parte cuando `completed_at` es `null` y, además, la tarea no está finalizada o el parte es anterior a su `finished_date`.
- Finalizar una diaria deja de exigirla desde su `finished_date` (incluido), pero las pendientes de días anteriores siguen contando.
- Las diarias pendientes del día de hoy son un **aviso** (se deben realizar). Las pendientes de días anteriores son un **error** (deben realizarse).
- Una diaria se puede marcar y desmarcar como realizada en cualquier parte existente, también en partes históricos, para poder resolver las atrasadas.

## Separación del resto de tareas
Las diarias no aparecen en:
- `Backlog`, `Kanban` y `Gestor de tiempos` (`tasks-list` las excluye salvo `ticket_type=Diaria`).
- Tabla del parte diario en `Tareas diarias` y bloques del `Horario diario` (`daily-report-get` las devuelve aparte en `daily_tasks`).
- `Completar tareas` (`tasks-completion-list`), `Ordenar tareas` (no tienen `order_points`), `Calendario` (`calendar-month-get`) y `Gráficas de rendimiento`.

## API
- `GET tasks-list?ticket_type=Diaria`: lista las diarias. Sin `ticket_type`, las diarias se excluyen.
- `GET daily-report-get`: añade `daily_tasks` (tareas `Diaria` del parte con su `completed_at`), ordenadas por `created_at`.
- `POST daily-report-create`: añade `added_daily_tasks` a la respuesta.
- `GET daily-tasks-pending`: devuelve `{ today, items: [{ task_id, ticket, title, more_info, report_date }] }` con todas las diarias pendientes, ordenadas por `report_date` ascendente.
- `PATCH daily-tasks-complete`: payload `{ task_id, report_date, completed }`; guarda o limpia `completed_at` en el parte indicado.

Detalle de contratos en `docs/04-api-contracts.md`.

## UI

### Pestaña `Diarias`
- Botón `Nueva tarea diaria`: modal simplificado con ticket, fecha de inicio, título y más info (sin tipo, prioridad, PE, PO ni PR). En edición añade estado `Activa`/`Finalizada` y borrado.
- Bloque `Pendientes de realizar`: diarias pendientes agrupadas por fecha de parte, marcadas como `Atrasada` (error) u `Hoy` (aviso), con casilla para marcarlas como realizadas.
- Tabla `Activas`: ticket, título, fecha de inicio y acciones `Editar` y `Finalizar` (con confirmación).
- Sección plegable `Finalizadas`: fecha de finalización y acción `Reactivar`.

### Horario diario
Arriba del todo, antes de la agenda, se muestra el bloque `Tareas diarias` del parte consultado con el progreso `realizadas / total` y una casilla por diaria. Las diarias no ocupan franjas horarias.

### Indicador de cabecera
Junto al indicador de cargas asíncronas se muestra una píldora con el número de diarias sin realizar:
- Verde (`diarias al día`) cuando no hay pendientes.
- Ámbar (`diarias de hoy`) cuando solo hay pendientes del día de hoy: aviso.
- Rojo con pulso (`diarias atrasadas`) cuando hay alguna pendiente de días anteriores: error.

Al pasar el ratón muestra el detalle agrupado en `Días anteriores` (con fecha) y `Hoy`. Al pulsarla navega a la pestaña `Diarias`.

## Casos límite
- Sin parte diario creado, las diarias no generan pendientes: la obligación nace al crear el parte.
- Borrar una diaria elimina también su historial de partes (`on delete cascade`).
- Si el marcado falla, la UI recarga el estado del servidor y muestra el error.
- La fecha de "hoy" se toma del servidor (UTC), igual que en `daily-report-create`.

## QA manual
1. Crear una diaria sin parte de hoy: no aparece en cabecera como pendiente.
2. Pulsar `Nuevo día`: el mensaje indica las diarias añadidas y la cabecera pasa a ámbar.
3. Marcar la diaria en `Horario diario`: el progreso se actualiza y la cabecera vuelve a verde.
4. Dejar una diaria sin marcar y crear el parte del día siguiente: la cabecera pasa a rojo y `Diarias` la muestra como `Atrasada`.
5. Finalizar una diaria: deja de añadirse a nuevos partes y no aparece en Backlog, Kanban, Completar tareas ni Calendario.
6. Comprobar que la diaria no aparece en la tabla del parte diario ni en las franjas del horario.
