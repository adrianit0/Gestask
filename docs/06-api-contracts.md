# Contratos API

Todas las funciones devuelven JSON y validan método HTTP.

## Auth existente
- `POST /functions/v1/auth-login`
- `POST /functions/v1/auth-register`

## Tareas
- `GET /functions/v1/tasks-list?status=&priority=&date=&search=&ticket_type=&sort_by=&sort_direction=`
- `POST /functions/v1/tasks-create`
- `PATCH /functions/v1/tasks-update`

### `tasks-list`

Parámetros existentes:
- `status`: filtra por `task_status`.
- `priority`: filtra por `priority`.
- `date`: filtra por `assigned_date`.
- `search`: busca en `title`, `ticket`, `more_info` y comentarios si el formato lo permite.

Parámetros nuevos:
- `ticket_type`: filtra por `Bug`, `Feature` o `Task`.
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

### `tasks-update`

Campos editables nuevos:
- `ticket_type`.
- `limit_date`.
- `comments`.

Reglas:
- Si `ticket_type = Task`, solo se permite `pr_status` `Not Finished` o `Imputed`.
- Si una tarea cambia a `ticket_type = Task` y tenía un estado PR no permitido, debe normalizarse a `Not Finished` salvo que ya esté imputada.
- Si `ticket_type != Task`, se mantiene la regla actual de PR al pasar a `Done`.
- Al añadir comentarios desde el detalle, no deben perderse comentarios existentes.

## Partes diarios
- `POST /functions/v1/daily-report-create`
- `GET /functions/v1/daily-report-get?date=YYYY-MM-DD&sort_by=&sort_direction=`

La consulta de parte diario puede aceptar la misma ordenación que `tasks-list` cuando devuelva tareas.

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
