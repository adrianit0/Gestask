# Modelo de Datos

## profiles
Perfil público de usuario vinculado a `auth.users`.

## tasks
Backlog del usuario. Incluye prioridad, estado de tarea, estado PR, esfuerzo, orden, fechas, tipo de ticket, fecha límite opcional y comentarios.

Campos relevantes actuales y previstos:

| Campo | Tipo esperado | Reglas |
|---|---|---|
| `id` | `uuid` | Identificador único. |
| `user_id` | `uuid` | Propietario de la tarea. |
| `ticket` | `text` | Referencia opcional a Jira. |
| `ticket_type` | `text` | `Bug`, `Feature` o `Task`. Por defecto `Bug`. |
| `assigned_date` | `date` | Fecha de inicio/asignación. Por defecto fecha actual. |
| `limit_date` | `date` | Fecha límite opcional. Por defecto `null`. |
| `finished_date` | `date` | Fecha de finalización, gestionada por reglas de estado. |
| `title` | `text` | Obligatorio. |
| `effort_points` | `integer` | Mayor o igual que 0. |
| `order_points` | `integer` | Puntos manuales de ordenación. |
| `priority` | `text` | `Trivial`, `Menor`, `Prioritaria`, `Crítica`, `Bloqueante`. |
| `task_status` | `text` | Estado de tarea catalogado. |
| `pr_status` | `text` | Estado PR o imputación según `ticket_type`. |
| `more_info` | `text` | Información adicional. |
| `comments` | `text` o `jsonb` | Comentarios añadidos desde el detalle de tarea. |
| `pr_link` | `text` | Enlace opcional al PR informado desde `Completar tareas`. |
| `test_cases` | `text` | Test cases opcionales para cierre de funcionalidades. Solo aplica funcionalmente a `Feature`. |
| `imputed_date` | `date` | Fecha editable en la que se imputan las horas tras `Need to Impute`. |
| `created_at` | `timestamptz` | Fecha de creación. |
| `updated_at` | `timestamptz` | Fecha de última actualización. |

### Reglas de `ticket_type`
- `ticket_type` debe tener constraint de catálogo: `Bug`, `Feature`, `Task`.
- El valor por defecto debe ser `Bug`.
- Para `Bug` y `Feature`, se mantiene el flujo PR completo: `Not Finished`, `Need PR`, `Need to Impute`, `Imputed`, `Deployed`.
- Para `Task`, solo se admiten `Not Finished`, `Need to Impute` e `Imputed`.
- `Task` no requiere `Need PR` ni `Deployed`.

### Reglas de `limit_date`
- `limit_date` es nullable.
- No debe bloquear la creación ni edición de una tarea.
- Si existe, debe poder usarse para filtros, ordenación y cálculo de scoring.

### Reglas de comentarios
- Los comentarios se almacenan dentro de la tarea.
- Si se usa `text`, el campo representa un historial plano acumulado.
- Si se usa `jsonb`, cada comentario debe incluir al menos texto, fecha de creación y autor.
- La opción preferida es `jsonb` si se necesita historial auditable; `text` es aceptable para una primera versión simple.

### Reglas de cierre de workflow
- `pr_link` es opcional y puede permanecer `null` aunque una tarea pase de `Need PR` a `Need to Impute`.
- `test_cases` es opcional y solo debe solicitarse en UI cuando `ticket_type = Feature`.
- `imputed_date` debe guardarse al pasar de `Need to Impute` a `Imputed`.
- El valor inicial recomendado para `imputed_date` es `finished_date`; si no existe, la implementación debe usar un fallback explícito y validado.
- Para `Task`, `Imputed` es estado final y no existe transición a `Deployed`.
- Para `Bug` y `Feature`, `Deployed` es el estado final del workflow posterior a `Done`.

### Reglas de orden manual
- `order_points` es la fuente de verdad del orden manual operativo.
- Una tarea solo participa en `Ordenar tareas` si `order_points` no es `null` y `task_status` no es `Done`, `Undone` ni `Unfinished`.
- El orden visual de la pestaña `Ordenar tareas` es `order_points desc`.
- La funcionalidad no requiere una tabla nueva si la actualización batch actúa sobre `tasks.order_points`.
- La actualización batch debe estar acotada por `user_id = auth.uid()` y validar que todas las tareas pertenecen al usuario autenticado.

## daily_reports
Parte diario único por usuario y fecha.

## daily_report_tasks
Relación histórica entre partes diarios y tareas.

## calendar_day_statuses
Excepciones manuales del calendario: Laboral, Vacaciones, Festivos, Ausencia.

## gestask_configuration
Catálogo global de parámetros configurables: `id`, `name`, `parameter_type`, `default_value`, `fixed_value`.

`parameter_type` admite tipos primitivos típicos como `string`, `number`, `boolean`, `date` y `datetime`.

Los parámetros de scoring deben crearse en este catálogo con nombres que empiecen por `scoring_`.

## gestask_configuration_profile
Valores personalizados por usuario: `configuration_id`, `user_id`, `value`.

Si no existe perfil para un parámetro, la lectura debe devolver el `default_value` de `gestask_configuration` sin insertar registro.

Si `fixed_value` es `true`, la lectura debe devolver siempre el `default_value` e ignorar cualquier valor personalizado existente.

## Campos calculados

### `scoring`
`scoring` no tiene que persistirse obligatoriamente. Puede calcularse en Edge Function, vista SQL o función SQL.

Debe devolverse en los listados de tareas cuando la UI lo necesite para mostrar u ordenar por scoring.

## Índices recomendados
- `tasks(user_id, task_status)` para filtros por estado.
- `tasks(user_id, finished_date)` para consultas de finalización.
- `tasks(user_id, assigned_date)` para ordenación por inicio.
- `tasks(user_id, limit_date)` para ordenación por fecha límite.
- `tasks(user_id, priority)` para filtros y ordenación por prioridad.
- `tasks(user_id, ticket_type)` para filtros y reglas por tipo.
- `tasks(user_id, task_status, pr_status)` para la vista `Completar tareas`.
- `tasks(user_id, imputed_date)` si se consultan cierres o imputaciones por fecha.
- `tasks(user_id, task_status, order_points)` para listar y actualizar eficientemente la vista `Ordenar tareas`.

## Reglas automáticas
- Trigger `normalize_task_state` mantiene coherencia entre `task_status`, `finished_date`, `pr_status` y `ticket_type`.
- Trigger `sync_task_with_today_report` añade tareas válidas al parte de hoy si existe.
- Trigger `touch_updated_at` actualiza `updated_at`.
