# Especificación UI

## Navegación
Barra superior fija con Backlog, Tareas Diarias, Completar tareas, Ordenar tareas, Calendario, Gestor de Tiempos, Gráficas de Rendimiento, Configuración y Logout.

La pestaña Configuración debe representarse con un icono de rueda dentada.

## Backlog
Tabla responsive con colores por estado y borde por estado PR. Crear/editar usa modal compartido.

La vista debe permitir:
- Filtrar por estado, prioridad, fecha de inicio, búsqueda y tipo de ticket.
- Ordenar por puntos de orden, scoring, fecha de inicio, fecha límite, prioridad, estado, tipo y fechas técnicas.
- Mostrar `ticket_type`, `limit_date` y `scoring` cuando el ancho disponible lo permita.
- Mantener scroll horizontal en móvil si la tabla supera el ancho disponible.

## Modal de creación y edición de tarea
Debe incluir:
- Ticket.
- Tipo de ticket: `Bug`, `Feature`, `Task`.
- Título.
- Fecha de inicio/asignación.
- Fecha límite opcional.
- Fecha de finalización cuando aplique.
- Puntos de esfuerzo.
- Puntos de orden.
- Prioridad.
- Estado de tarea.
- Estado PR/imputación según tipo.
- Más info.

Reglas visuales:
- Si `ticket_type = Task`, el selector de PR solo muestra `Not Finished`, `Need to Impute` e `Imputed`.
- Si `ticket_type != Task`, el selector de PR muestra el catálogo completo cuando la tarea está en estado que lo permite.
- `limit_date` puede quedar vacío.

## Detalle de tarea
El detalle debe ser ligeramente más compacto que la versión actual para incluir más información sin aumentar el tamaño del modal.

En escritorio:
- La rejilla mostrará 3 elementos por línea.
- Los campos largos pueden ocupar varias columnas cuando sea necesario.
- El modal debe reducir paddings y separación visual respecto a la versión actual.

En móvil:
- La rejilla puede pasar a 1 columna.
- Los comentarios deben seguir siendo accesibles al final del modal.

Campos mínimos en detalle:
- Ticket.
- Tipo.
- Título.
- Fecha inicio/asignación.
- Fecha límite.
- Fecha finalización.
- Esfuerzo.
- Orden.
- Scoring.
- Prioridad.
- Estado.
- PR/imputación.
- Más info.

## Comentarios en detalle de tarea
Al final del detalle de tarea debe existir una sección de comentarios.

La sección debe permitir:
- Ver comentarios existentes.
- Escribir un nuevo comentario.
- Guardarlo dentro de la tarea sin cerrar necesariamente el detalle.
- Mostrar errores de guardado sin perder el texto escrito.

Reglas de UX:
- No permitir guardar comentarios vacíos.
- Mostrar fecha y autor si el modelo elegido lo soporta.
- Mantener el historial visible debajo de la información principal.

## Tareas Diarias
Selector de fecha, botón Nuevo día, aviso de modo histórico y listado ordenado por `order_points` descendente por defecto.

La vista debe permitir cambiar la ordenación usando los mismos criterios principales que Backlog cuando aplique.

## Completar tareas
Pantalla operativa para cerrar tareas que ya están en `Done` pero cuyo workflow posterior no ha terminado.

La vista debe mostrar exclusivamente:
- Tareas `Bug` y `Feature` con `task_status = Done` y `pr_status` distinto de `Deployed`.
- Tareas `Task` con `task_status = Done` y `pr_status` distinto de `Imputed`.

La vista no debe incluir filtros, scoring visible como criterio ni controles de ordenación funcionales.

Orden fijo de presentación:
- Primero por estado PR: `Need PR`, `Need to Impute`, `Imputed`, `Deployed`.
- Después por fecha de finalización de menor a mayor.

Campos mínimos de tabla:
- Ticket como hipervínculo cuando exista URL o patrón de enlace configurado.
- Tipo.
- Título.
- Fecha de finalización.
- Esfuerzo u horas a imputar.
- Estado PR/imputación.
- Acción `Resolver` cuando exista una transición disponible.

### Resolver `Need PR`
Aplica a tareas `Bug` y `Feature` en `pr_status = Need PR`.

Al pulsar `Resolver`, debe abrirse un popup con:
- Campo opcional `pr_link` para informar el enlace al PR.
- Campo opcional `test_cases` solo cuando `ticket_type = Feature`.
- Botón de confirmar.
- Botón de cancelar.

Reglas:
- Ambos campos son opcionales.
- Confirmar sin datos debe ser válido.
- Tras confirmar, la tarea pasa a `pr_status = Need to Impute`.

### Resolver `Need to Impute`
Aplica a tareas en `pr_status = Need to Impute`.

Al pulsar `Resolver`, debe abrirse un popup con:
- Hipervínculo al ticket.
- Título de la tarea.
- Fecha de resolución, tomada de `finished_date`.
- Cantidad de horas que se deben imputar.
- Campo de tipo `date` llamado `imputed_date`.
- Botón de confirmar.
- Botón de cancelar.

Reglas:
- `imputed_date` aparece inicialmente con el mismo valor que `finished_date`.
- `imputed_date` es editable antes de confirmar.
- Tras confirmar, la tarea pasa a `pr_status = Imputed`.

### Resolver `Imputed`
Aplica solo a tareas `Bug` y `Feature` en `pr_status = Imputed`.

Al pulsar `Resolver`, debe abrirse un popup con:
- Hipervínculo al ticket.
- Aviso claro de que el usuario debe cerrar la tarea en el sistema externo.
- Botón de confirmar.
- Botón de cancelar.

Reglas:
- Tras confirmar, la tarea pasa a `pr_status = Deployed`.
- Las tareas `Task` no muestran este paso porque su workflow termina en `Imputed`.

## Ordenar tareas
Pantalla operativa para ajustar el orden manual de tareas pendientes usando `order_points`.

La vista debe mostrar exclusivamente:
- Tareas con `task_status` distinto de `Done`, `Undone` y `Unfinished`.
- Tareas con `order_points` informado.

Orden fijo de presentación:
- `order_points` descendente.
- Desempate estable por `created_at desc` e `id asc` si hubiera empates.

Campos mínimos de tabla o lista:
- Posición visual.
- Ticket como hipervínculo cuando exista.
- Tipo.
- Título.
- Estado.
- Prioridad.
- Fecha de inicio.
- Fecha límite.
- Puntos de orden.
- Acciones para mover arriba y mover abajo.

Acciones:
- `Subir`: mueve la tarea una posición hacia arriba si no es la primera.
- `Bajar`: mueve la tarea una posición hacia abajo si no es la última.
- `Ordenar automaticamente`: recalcula todas las tareas visibles a una secuencia desde `1` hasta `N`.

Reglas de UX:
- La primera tarea no debe permitir `Subir`.
- La última tarea no debe permitir `Bajar`.
- Tras mover una tarea, la UI debe recalcular el orden localmente y enviar una única llamada batch con las tareas afectadas.
- Mientras se guarda, los controles deben quedar deshabilitados o mostrar estado de carga para evitar dobles envíos.
- Si falla el guardado, la UI debe restaurar el último orden confirmado o mostrar un error claro sin perder la lista.
- La acción `Ordenar automaticamente` debe mostrar confirmación si el número de tareas afectadas es alto o si se detectan empates relevantes.

## Calendario
Grid mensual. Cada día muestra estado, puntos y tickets/tareas finalizadas.

## Configuración
Pantalla protegida para modificar parámetros de usuario y crear nuevos parámetros globales.

La vista debe mostrar:
- Nombre del parámetro.
- Tipo primitivo.
- Valor efectivo.
- Indicador de valor fijo.
- Control de edición adecuado al tipo.

Los parámetros con `fixed_value = true` se muestran en solo lectura y siempre usan el valor por defecto.

La creación de parámetros debe solicitar `name`, `parameter_type`, `default_value` y `fixed_value`.

Los parámetros `scoring_*` deben mostrarse igual que el resto, aunque se recomienda agruparlos visualmente bajo una sección `Scoring` si la lista crece.

## Colores
- Principal: `#ff8000`.
- Secundario: `#ffdbb6`.
- Estados según requisitos del backlog y calendario.

## Responsive
En móvil, tablas se desplazan horizontalmente y la navegación permite wrap.
