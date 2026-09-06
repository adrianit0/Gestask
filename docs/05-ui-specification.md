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

## Indicador de comentarios en tablas de tareas
Todas las tablas de tareas (Backlog, Tareas Diarias y vista completa) muestran, junto al título de la tarea, un indicador con el número de comentarios que tiene. El indicador solo se muestra cuando la tarea tiene al menos un comentario.

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
- El historial se muestra en orden inverso al de almacenamiento: el comentario más reciente aparece primero.

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
- Ticket como hipervínculo cuando exista `project-external-page` configurado. Si está en blanco, el ticket se muestra como texto plano.
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

## Horario diario
Agenda con franjas horarias generada a partir del parte diario. Cabecera con resumen de PE planificados frente a PE diarios y el rango horario efectivo.

Al final del listado se muestra un botón a todo el ancho disponible para incluir horas extra:
- Borde gris con transparencia y línea discontinua, fondo blanco muy transparente y texto gris.
- Altura aproximada de 5 veces la altura del texto.
- Texto `(+) Incluir horas` cuando está desactivado y `Mostrar menos horas` cuando está activado.
- Al activarlo, la hora de fin efectiva se amplía `PE_diario_extra` puntos de esfuerzo y se planifican tareas adicionales por encima de la hora de fin.
- Al desactivarlo, se vuelve a la jornada base y se eliminan las tareas de la franja extra.

El detalle de comportamiento y los casos límite están en `docs/09-daily-schedule.md`.

## Calendario
Grid mensual. Cada día muestra estado, puntos y tickets/tareas finalizadas.

## Gráficas de Rendimiento
Vista con métricas y gráficas del mes consultado.

### Bloque de métricas
La parte superior mantiene las tarjetas de métricas (tareas abiertas/terminadas, puntos, porcentajes, horas y días) y el selector `Mostrar todo`. Este bloque es siempre visible, independientemente del grupo de gráficas seleccionado.

### Gráficas de distribución siempre visibles
Encima del área de grupos se muestran, siempre visibles y como barras horizontales, las gráficas categóricas de distribución:
- Estados de tarea
- Prioridad

### Organización de las gráficas por grupos
El resto de gráficas (series por día) se dividen en grupos diferenciados. A la izquierda del área de gráficas hay un menú vertical con un elemento por grupo; al seleccionar un grupo se muestran únicamente sus gráficas en el panel de la derecha. Por defecto se muestra el primer grupo (`Rendimiento de puntos`).

Grupos y gráficas que contienen, en orden:

1. **Rendimiento de puntos**
   - Puntos completados este mes
   - Puntos nuevos este mes
   - Diferencia entre nuevas y terminadas (puntos)
2. **Rendimiento de tareas**
   - Tareas terminadas por día
   - Tareas creadas por día
   - Diferencia entre nuevas y terminadas (tareas)
3. **Rendimiento acumulado** (las tres gráficas son de línea)
   - Ritmo terminado acumulado del mes (acumulado de puntos completados, positivo)
   - Ritmo acumulado creado del mes (acumulado de puntos nuevos/creados, dibujado en negativo)
   - Diferencia entre nuevas y terminadas (acumulado de completados − creados)
4. **Distribución y resumen**
   - Trabajo por día de la semana

Nota sobre los acumulados: «terminado» acumula los puntos completados del calendario y «creado» acumula los puntos nuevos asignados por día; ambas series son independientes y la tercera gráfica representa el acumulado de su diferencia.

### Convenio de signo
En todas las gráficas donde se comparan o combinan ambos conceptos (las dos de diferencia diaria y las tres del grupo acumulado):
- Lo **completado/terminado/finalizado** cuenta como valor **positivo** (por encima del 0).
- Lo **nuevo/creado** cuenta como valor **negativo** (por debajo del 0).
- En consecuencia, la diferencia diaria se calcula como `terminadas − nuevas`.

El convenio no aplica a las gráficas que muestran solo creados (`Puntos nuevos este mes`, `Tareas creadas por día`), que siguen como barras positivas.

### Representación de las gráficas
- Las series diarias de magnitudes no negativas (puntos completados/nuevos, tareas terminadas/creadas) se representan como barras verticales.
- Las gráficas de **diferencia** (puntos y tareas) y las **tres del grupo acumulado** se representan como **gráfica de línea con línea base en 0**: los valores positivos se dibujan por encima y los negativos por debajo del eje cero.
- Estados de tarea y Prioridad se representan como barras horizontales.

Regla de inclusión de tareas:
- Las tareas con `task_status` igual a `Undone` o `Unfinished` no cuentan en ninguna gráfica.
- La exclusión aplica a todas las gráficas basadas en tareas: tanto las de tareas nuevas/creadas como las de puntos de esfuerzo (nuevos, diferencias y acumulados).
- La exclusión es independiente del selector `Mostrar todo`: una tarea `Undone` o `Unfinished` nunca se contabiliza.
- Las gráficas basadas en datos del parte diario (puntos completados y tareas terminadas por día) no se ven afectadas, ya que provienen del calendario y no del estado actual de la tarea.

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
