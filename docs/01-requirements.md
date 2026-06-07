# Requisitos

## Funcionales
- Registro e inicio de sesión mediante Edge Functions `auth-register` y `auth-login`.
- Dashboard protegido por sesión.
- Backlog CRUD básico: listar, crear, editar y cambiar estados.
- Enlace a Jira para tickets.
- Parte diario único por usuario y fecha.
- Consulta de partes diarios por fecha con modo histórico de solo lectura.
- Calendario mensual con puntos completados y tareas/tickets finalizados.
- Marcado de Laboral, Vacaciones, Festivos y Ausencia.
- Pestaña de Configuración para consultar, modificar y crear parámetros configurables.
- Placeholders para Gestor de Tiempos y Gráficas.
- Las tareas deben admitir fecha límite opcional mediante `limit_date`.
- Las tareas deben admitir tipo de ticket mediante `ticket_type` con valores `Bug`, `Feature` y `Task`.
- El detalle de tarea debe mostrar más información reduciendo ligeramente su tamaño y usando 3 campos por línea en escritorio.
- El detalle de tarea debe permitir añadir comentarios al final, persistidos dentro de la tarea.
- Cada tarea debe exponer un valor de scoring calculado a partir de tipo, urgencia, antigüedad, esfuerzo, orden, fecha límite y otros factores configurables.
- Los listados de tareas deben permitir ordenar por puntos de orden, scoring, fecha de inicio, fecha límite, prioridad, estado y otros campos relevantes.

## No funcionales
- Responsive.
- Sin claves privadas en cliente.
- RLS obligatorio.
- Errores claros.
- Código simple y extensible.
- El scoring debe calcularse de forma determinista y documentada.
- La ordenación debe ser estable cuando existan empates, usando `created_at` o `id` como desempate técnico.

## Flujos principales
- Usuario se registra o inicia sesión.
- Accede a Backlog y crea tareas.
- Cambia una tarea a `Done`; se asigna `finished_date` y `pr_status = Need PR` si procede.
- Crea un nuevo parte diario; las tareas pendientes del parte anterior pasan a `Unfinished`.
- Consulta días anteriores en modo histórico.
- Visualiza el calendario mensual y marca ausencias o vacaciones.
- Accede a Configuración, modifica valores propios y crea nuevos parámetros configurables.
- Crea o edita una tarea indicando opcionalmente `limit_date` y seleccionando `ticket_type`.
- Consulta el detalle de tarea, añade comentarios y guarda los cambios dentro de la tarea.
- Cambia el criterio de ordenación del backlog o de tareas diarias y el listado se actualiza respetando filtros activos.

## Reglas de negocio
- Estados de tarea: `To do`, `Doing`, `Draft`, `Undone`, `Unfinished`, `Need Fix`, `Waiting`, `Done`, `Warning`.
- Estados PR generales: `Not Finished`, `Need PR`, `PR Hecho`, `Imputed`, `Deployed`.
- Estados PR para tareas con `ticket_type = Task`: solo `Not Finished` e `Imputed`.
- Tipos de ticket: `Bug`, `Feature`, `Task`.
- Tipo de ticket por defecto: `Bug`.
- `limit_date` es opcional y por defecto debe ser `null`.
- Prioridades: `Trivial`, `Menor`, `Prioritaria`, `Crítica`, `Bloqueante`.
- Si `task_status != Done`, `pr_status` debe ser `Not Finished` y `finished_date` debe ser `null`, excepto cuando `ticket_type = Task` y el estado final permitido sea `Imputed` según la transición definida para ese tipo.
- Si `task_status` pasa a `Done` y `ticket_type` no es `Task`, `finished_date` se rellena si estaba vacía y `pr_status` pasa a `Need PR` si estaba en `Not Finished`.
- Si `ticket_type = Task`, no se requiere flujo de PR; el estado final de imputación será `Imputed`.
- Solo existe un parte diario por usuario y fecha.
- Tareas válidas para parte diario: `To do`, `Doing`, `Draft`, `Need Fix`, `Waiting`, `Warning`.
- Tareas no cargadas: `Done`, `Undone`, `Unfinished`.
- Sábados y domingos son `Finde`.
- Si un parámetro no tiene perfil de usuario, se devuelve el `default_value` sin insertar registro personalizado.
- Si `fixed_value = true`, se devuelve siempre el `default_value`, se ignora cualquier valor personalizado existente y el campo queda en solo lectura.
- Solo se persisten valores de configuración de usuario cuando difieren del valor por defecto.
- Los multiplicadores del scoring se obtienen desde configuración y sus nombres deben empezar por `scoring_`.
- Si falta un multiplicador de scoring, debe usarse un valor por defecto documentado y no romper el listado.

## Permisos
Cada usuario solo puede ver y modificar sus perfiles, tareas, partes diarios y estados de calendario.

Cada usuario solo puede ver y modificar sus valores propios de configuración. La creación de parámetros globales de configuración debe estar protegida.

## Casos límite y validaciones
- Email/password obligatorios.
- Título de tarea obligatorio.
- `effort_points >= 0`.
- Rechazar estados fuera de catálogo.
- Rechazar `ticket_type` fuera del catálogo.
- Rechazar `pr_status` incompatible con `ticket_type`.
- `limit_date` debe ser una fecha válida o `null`.
- Comentarios vacíos no deben crear entradas persistidas.
- Duplicado de parte diario devuelve `El parte diario está ya creado`.
- Fecha de consulta inválida devuelve 400.
- `parameter_type` de configuración debe pertenecer al catálogo de tipos primitivos permitido.
- `default_value` y `value` deben ser válidos para el `parameter_type` configurado.
- `sort_by` y `sort_direction` deben validarse contra el catálogo permitido.
