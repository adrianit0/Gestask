# Contratos API

Todas las funciones devuelven JSON y validan método HTTP.

## Auth existente
- `POST /functions/v1/auth-login`
- `POST /functions/v1/auth-register`

## Tareas
- `GET /functions/v1/tasks-list?status=&priority=&date=&search=&ticket_type=&sort_by=&sort_direction=`
- `GET /functions/v1/tasks-completion-list`
- `PATCH /functions/v1/tasks-completion-resolve`
- `GET /functions/v1/tasks-order-list`
- `PATCH /functions/v1/tasks-order-update`
- `POST /functions/v1/tasks-create`
- `PATCH /functions/v1/tasks-update`

### `tasks-list`

Parámetros existentes:
- `status`: filtra por `task_status`.
- `priority`: filtra por `priority`.
- `date`: filtra por `assigned_date`.
- `search`: busca en `title`, `ticket`, `more_info` y comentarios si el formato lo permite.

Parámetros nuevos:
- `ticket_type`: filtra por `Bug`, `Feature`, `Task` o `Diaria`. Si no se informa, las tareas `Diaria` se excluyen del listado.
- `sort_by`: campo de ordenación.
- `sort_direction`: `asc` o `desc`.

Valores permitidos para `sort_by`:
- `order_points`.
- `scoring`.
- `assigned_date`.
- `limit_date`.
- `priority`.
- `task_status`.
- `pr_status`.
- `ticket_type`.
- `created_at`.
- `updated_at`.

Respuesta esperada:

```json
{
  "tasks": [
    {
      "id": "uuid",
      "ticket_type": "Bug",
      "limit_date": null,
      "scoring": 12.5
    }
  ]
}
```

### `tasks-create`

Campos aceptados nuevos:
- `ticket_type`: opcional, por defecto `Bug`.
- `limit_date`: opcional, por defecto `null`.
- `comments`: opcional, vacío por defecto.

Validaciones:
- `title` obligatorio.
- `ticket_type` debe pertenecer al catálogo.
- `limit_date` debe ser fecha válida o `null`.
- `comments` debe respetar el formato elegido en modelo de datos.
- Si `ticket_type = Diaria`, se ignoran `effort_points` y `order_points`: se guardan como `0` y `null`.

### `tasks-update`

Campos editables nuevos:
- `ticket_type`.
- `limit_date`.
- `comments`.
- `pr_link`.
- `test_cases`.
- `imputed_date`.

Reglas:
- Si `ticket_type = Task`, solo se permite `pr_status` `Not Finished`, `Need to Impute` o `Imputed`.
- Si una tarea cambia a `ticket_type = Task` y tenía un estado PR no permitido, debe normalizarse a `Not Finished` salvo que ya esté imputada.
- Si `ticket_type != Task`, se mantiene la regla actual de PR al pasar a `Done`.
- Al añadir comentarios desde el detalle, no deben perderse comentarios existentes.
- Una tarea no puede cambiar de tipo desde o hacia `Diaria` (`Daily ticket type cannot be changed.`).
- Si `ticket_type = Diaria`, solo se admite `task_status` `To do` o `Done` (`Invalid task status for ticket type.`); `effort_points`, `order_points` y `pr_status` se fuerzan a `0`, `null` y `Not Finished`, y `finished_date` se rellena al pasar a `Done` y se vacía al volver a `To do`.

### `tasks-completion-list`

Lista tareas disponibles para la funcionalidad `Completar tareas`.

No acepta criterios funcionales de filtrado u ordenación. La presentación debe usar un orden fijo por `pr_status` y `finished_date`.

Reglas de inclusión:
- Excluir siempre las tareas `Diaria`.
- Incluir tareas `Bug` y `Feature` con `task_status = Done` y `pr_status != Deployed`.
- Incluir tareas `Task` con `task_status = Done` y `pr_status != Imputed`.
- Excluir cualquier tarea que no esté en `Done`.
- Excluir tareas `Bug` y `Feature` ya `Deployed`.
- Excluir tareas `Task` ya `Imputed`.

Orden de presentación:
- Primero por `pr_status`: `Need PR`, `Need to Impute`, `Imputed`, `Deployed`.
- Después por `finished_date` ascendente.

Respuesta esperada:

```json
{
  "tasks": [
    {
      "id": "uuid",
      "ticket": "ABC-123",
      "ticket_type": "Feature",
      "title": "Título",
      "finished_date": "2026-06-07",
      "effort_points": 4,
      "pr_status": "Need PR",
      "pr_link": null,
      "test_cases": null,
      "imputed_date": null
    }
  ]
}
```

### `tasks-completion-resolve`

Resuelve el siguiente paso del workflow de una tarea incluida en `Completar tareas`.

Payload base:

```json
{
  "id": "uuid"
}
```

Payload para `Need PR`:

```json
{
  "id": "uuid",
  "pr_link": "https://example.com/pr/1",
  "test_cases": "Casos de prueba opcionales"
}
```

Reglas:
- Solo aplica a `Bug` y `Feature` con `pr_status = Need PR`.
- `pr_link` es opcional.
- `test_cases` es opcional y solo se usa funcionalmente para `Feature`.
- Tras resolver, `pr_status` pasa a `Need to Impute`.

Payload para `Need to Impute`:

```json
{
  "id": "uuid",
  "imputed_date": "2026-06-07"
}
```

Reglas:
- `imputed_date` es obligatorio al confirmar este paso y debe ser una fecha válida.
- La UI debe precargar `imputed_date` con `finished_date`, pero la API debe validar el valor recibido.
- Tras resolver, `pr_status` pasa a `Imputed`.

Payload para `Imputed`:

```json
{
  "id": "uuid"
}
```

Reglas:
- Solo aplica a `Bug` y `Feature` con `pr_status = Imputed`.
- Tras resolver, `pr_status` pasa a `Deployed`.
- No aplica a `Task`, porque su workflow termina en `Imputed`.

### `tasks-order-list`

Lista tareas disponibles para la pestaña `Ordenar tareas`.

No acepta filtros funcionales. La API debe aplicar siempre las reglas de inclusión documentadas.

Reglas de inclusión:
- Incluir tareas con `task_status` distinto de `Done`, `Undone` y `Unfinished`.
- Incluir solo tareas con `order_points` no nulo.
- Excluir tareas de otros usuarios.

Orden de respuesta:
- `order_points` descendente.
- `created_at desc` e `id asc` como desempate estable si hubiera empates.

Respuesta esperada:

```json
{
  "tasks": [
    {
      "id": "uuid",
      "ticket": "ABC-123",
      "ticket_type": "Bug",
      "title": "Título",
      "order_points": 8,
      "priority": "Prioritaria",
      "task_status": "Doing",
      "assigned_date": "2026-06-09",
      "limit_date": null
    }
  ]
}
```

### `tasks-order-update`

Actualiza `order_points` de varias tareas ordenables en una única llamada.

Payload:

```json
{
  "updates": [
    { "id": "uuid-a", "order_points": 5 },
    { "id": "uuid-b", "order_points": 4 }
  ]
}
```

Reglas:
- Método `PATCH`.
- `updates` debe ser un array no vacío.
- Cada `id` debe existir, pertenecer al usuario autenticado y ser ordenable.
- Cada `order_points` debe ser entero.
- No se permiten IDs duplicados.
- La función debe aplicar los cambios en una única operación lógica. Si alguna validación falla, no debe aplicar cambios parciales.
- La respuesta debe devolver las tareas ordenables ya recalculadas para refrescar la UI sin una llamada adicional si es viable.

Respuesta esperada:

```json
{
  "tasks": [
    {
      "id": "uuid-a",
      "order_points": 5
    }
  ]
}
```

Errores específicos:
- `Invalid order payload.`
- `Task is not orderable.`
- `Duplicate task id.`

## Partes diarios
- `POST /functions/v1/daily-report-create`
- `GET /functions/v1/daily-report-get?date=YYYY-MM-DD&sort_by=&sort_direction=`

La consulta de parte diario puede aceptar la misma ordenación que `tasks-list` cuando devuelva tareas.

### `daily-report-create`
- Añade al parte las tareas normales válidas y todas las tareas `Diaria` con `finished_date` nulo.
- Respuesta: `{ "report": {...}, "added_tasks": 5, "added_daily_tasks": 2 }`.

### `daily-report-get`
- `tasks` excluye las tareas `Diaria`.
- `daily_tasks` devuelve las tareas `Diaria` del parte con su `completed_at`, ordenadas por `created_at`.

## Tareas diarias (`Diaria`)
- `GET /functions/v1/daily-tasks-pending`
- `PATCH /functions/v1/daily-tasks-complete`

### `daily-tasks-pending`
Devuelve todas las diarias sin realizar de cualquier parte del usuario. Una diaria está pendiente si `completed_at` es nulo y la tarea no está finalizada o el parte es anterior a su `finished_date`.

```json
{
  "today": "2026-09-14",
  "items": [
    { "task_id": "uuid", "ticket": null, "title": "Revisar correo", "more_info": null, "report_date": "2026-09-13" }
  ]
}
```

Orden: `report_date` ascendente y `title`. La UI clasifica `report_date < today` como error y el resto como aviso.

### `daily-tasks-complete`
Payload:

```json
{ "task_id": "uuid", "report_date": "2026-09-13", "completed": true }
```

Reglas:
- Método `PATCH`.
- `task_id` obligatorio, `report_date` fecha válida y `completed` booleano.
- La tarea debe pertenecer al usuario y ser `Diaria`; el parte debe existir y contener la tarea.
- `completed = true` guarda `completed_at = now()`; `false` lo limpia.

Respuesta: `{ "task_id": "uuid", "report_date": "2026-09-13", "completed_at": "2026-09-14T08:00:00Z" }`.

Errores: `Task not found.`, `Task is not a daily task.`, `Daily report not found.`, `Daily task not found in report.`, `Invalid completion value.`

## Calendario
- `GET /functions/v1/calendar-month-get?year=YYYY&month=MM`
- `PATCH /functions/v1/calendar-day-status-update`

## Configuración
- `GET /functions/v1/configuration-list`
- `PATCH /functions/v1/configuration-profile-update`
- `POST /functions/v1/configuration-create`

### Reglas de respuesta
- `configuration-list` devuelve todos los parámetros disponibles para el usuario.
- Si no existe perfil personalizado, devuelve un objeto equivalente con `configuration_id: null` y `value` igual a `default_value`.
- Si `fixed_value` es `true`, devuelve siempre `default_value`, aunque exista valor personalizado.
- Los valores fijos deben marcarse como solo lectura para la UI.
- Los parámetros `scoring_*` deben poder recuperarse junto al resto de configuración.

### Reglas de escritura
- `configuration-profile-update` solo puede guardar valores de configuración del usuario autenticado.
- No se permite modificar valores con `fixed_value = true`.
- Solo debe persistirse un perfil cuando el valor difiere del `default_value`.
- `configuration-create` crea nuevos parámetros en `gestask_configuration` validando `name`, `parameter_type`, `default_value` y `fixed_value`.
- Los parámetros `scoring_*` deben usar `parameter_type = number` salvo justificación documentada.

## Errores
Formato común: `{ "error": "mensaje" }`.

Errores nuevos esperados:
- `Invalid ticket type.`
- `Invalid PR status for ticket type.`
- `Invalid limit date.`
- `Invalid sort field.`
- `Invalid sort direction.`
- `Invalid scoring configuration.`
- `Invalid completion transition.`
- `Invalid imputed date.`
- `Invalid order payload.`
- `Task is not orderable.`
- `Duplicate task id.`
- `Daily ticket type cannot be changed.`
- `Invalid task status for ticket type.`
