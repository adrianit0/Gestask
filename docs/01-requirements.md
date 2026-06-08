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
- Debe existir una funcionalidad nueva llamada `Completar tareas` para cerrar el workflow posterior a `Done`.
- `Completar tareas` debe mostrar solo tareas con `task_status = Done` cuyo workflow no haya finalizado: tareas `Bug` y `Feature` con `pr_status != Deployed`, y tareas `Task` con `pr_status != Imputed`.
- `Completar tareas` no debe aplicar scoring ni permitir criterios de ordenación configurables por el usuario.
- `Completar tareas` debe mostrar siempre las tareas ordenadas por estado PR en este orden: `Need PR`, `Need to Impute`, `Imputed`, `Deployed`; dentro de cada estado, debe ordenar por `finished_date` de menor a mayor.
- Desde `Completar tareas`, el usuario debe poder resolver los pasos pendientes mediante popups guiados segun `pr_status` y `ticket_type`.

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
- Accede a `Completar tareas` para avanzar tareas ya finalizadas por los estados `Need PR`, `Need to Impute`, `Imputed` y `Deployed` segun corresponda.
- Crea un nuevo parte diario.
- Consulta días anteriores en modo histórico.
- Visualiza el calendario mensual y marca ausencias o vacaciones.
- Accede a Configuración, modifica valores propios y crea nuevos parámetros configurables.
- Crea o edita una tarea indicando opcionalmente `limit_date` y seleccionando `ticket_type`.
- Consulta el detalle de tarea, añade comentarios y guarda los cambios dentro de la tarea.
- Cambia el criterio de ordenación del backlog o de tareas diarias y el listado se actualiza respetando filtros activos.

## Reglas de negocio
- Estados de tarea: `To do`, `Doing`, `Draft`, `Undone`, `Unfinished`, `Need Fix`, `Waiting`, `Done`, `Warning`.
- Estados PR generales: `Not Finished`, `Need PR`, `Need to Impute`, `Imputed`, `Deployed`.
- Estados PR para tareas con `ticket_type = Task`: solo `Not Finished`, `Need to Impute` e `Imputed`.
- Tipos de ticket: `Bug`, `Feature`, `Task`.
- Tipo de ticket por defecto: `Bug`.
- `limit_date` es opcional y por defecto debe ser `null`.
- Prioridades: `Trivial`, `Menor`, `Prioritaria`, `Crítica`, `Bloqueante`.
- Si `task_status != Done`, `pr_status` debe ser `Not Finished` y `finished_date` debe ser `null`, excepto cuando `ticket_type = Task` y el estado final permitido sea `Imputed` según la transición definida para ese tipo.
- Si `task_status` pasa a `Done` y `ticket_type` no es `Task`, `finished_date` se rellena si estaba vacía y `pr_status` pasa a `Need PR` si estaba en `Not Finished`.
- Si `ticket_type = Task`, no se requiere PR ni despliegue; al finalizar pasa a `Need to Impute` y su estado final será `Imputed` tras confirmar la imputación.
- En `Completar tareas`, una tarea `Bug` o `Feature` con `pr_status = Need PR` debe mostrar la acción `Resolver`; al confirmar, puede guardar opcionalmente un enlace al PR y, si es `Feature`, tambien test cases opcionales; despues debe pasar a `Need to Impute`.
- En `Completar tareas`, una tarea con `pr_status = Need to Impute` debe mostrar la acción `Resolver`; al confirmar, debe pedir fecha de imputación editable (`imputed_date`) con valor inicial igual a `finished_date`, mostrar ticket, título, fecha de resolución y horas a imputar, y despues pasar a `Imputed`.
- En `Completar tareas`, una tarea `Bug` o `Feature` con `pr_status = Imputed` debe mostrar la acción `Resolver`; al confirmar el cierre externo de la tarea, debe pasar a `Deployed`.
- Una tarea `Task` finaliza su workflow en `Imputed`; no debe ofrecer paso de despliegue ni cierre posterior.
- El enlace al PR, los test cases y la fecha de imputación forman parte de la información de cierre de workflow y deben poder persistirse si se desarrolla la funcionalidad.
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
- En `Completar tareas`, `pr_link` y `test_cases` son opcionales y no deben bloquear la transición a `Need to Impute`.
- En `Completar tareas`, `imputed_date` debe ser una fecha válida; si `finished_date` no existe, el popup debe usar la fecha actual como fallback documentado por la implementación.
