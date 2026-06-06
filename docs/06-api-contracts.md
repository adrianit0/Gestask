# Contratos API

Todas las funciones devuelven JSON y validan método HTTP.

## Auth existente
- `POST /functions/v1/auth-login`
- `POST /functions/v1/auth-register`

## Tareas
- `GET /functions/v1/tasks-list?status=&priority=&date=&search=`
- `POST /functions/v1/tasks-create`
- `PATCH /functions/v1/tasks-update`

## Partes diarios
- `POST /functions/v1/daily-report-create`
- `GET /functions/v1/daily-report-get?date=YYYY-MM-DD`

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

### Reglas de escritura
- `configuration-profile-update` solo puede guardar valores de configuración del usuario autenticado.
- No se permite modificar valores con `fixed_value = true`.
- Solo debe persistirse un perfil cuando el valor difiere del `default_value`.
- `configuration-create` crea nuevos parámetros en `gestask_configuration` validando `name`, `parameter_type`, `default_value` y `fixed_value`.

## Errores
Formato común: `{ "error": "mensaje" }`.
