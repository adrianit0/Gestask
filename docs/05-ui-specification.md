# Especificación UI

## Navegación
Menú lateral izquierdo fijo (ocupa todo el alto y no se desplaza con la página). De arriba abajo contiene:
- Marca `Gestask` con su logo y el botón `Plegar menú` / `Desplegar menú`.
- Indicador de cargas asíncronas e indicador de tareas diarias sin realizar (verde sin pendientes, ámbar como aviso si solo hay pendientes de hoy, rojo como error si hay pendientes de días anteriores). El indicador de diarias muestra el detalle al pasar el ratón y navega a `Diarias` al pulsarlo. Detalle en `docs/10-daily-tasks.md`.
- Pestañas agrupadas en secciones, cada una con icono y nombre:
  - `Tareas`: Backlog, Kanban, Ordenar tareas y Completar tareas.
  - `Día a día`: Tareas diarias, Horario diario y Diarias.
  - `Seguimiento`: Calendario, Gestor de tiempos y Gráficas de rendimiento.
- Pie con Configuración (icono de rueda dentada), selector de tema, Actualizar datos y Cerrar sesión, con el email de la sesión debajo de `Cerrar sesión`.

La pestaña activa se resalta con el color secundario y una marca vertical del color principal en el borde izquierdo. `Completar tareas` muestra un contador con las tareas que esperan un paso de cierre (`Need PR`, `Need to Impute` e `Imputed`); al pasar el ratón se ve el desglose por estado. Si no hay ninguna, no se muestra el contador.

Estados del menú:
- **Desplegado** (por defecto): iconos, nombres, títulos de sección, etiquetas de los indicadores y email.
- **Plegado**: solo iconos. Los títulos de sección pasan a ser separadores, los indicadores muestran solo punto y número, el contador de `Completar tareas` se superpone al icono y el nombre de cada pestaña aparece como tooltip.
- El estado plegado/desplegado se recuerda en el navegador (`localStorage`, clave `gestask.sidebarCollapsed`). Si el almacenamiento no está disponible, el menú arranca desplegado.
- Si el alto de la ventana no alcanza, solo se desplaza la lista de pestañas; marca, indicadores y pie permanecen visibles.

## Sistema visual común
- **Tema**: claro, oscuro o del sistema. El botón del pie del menú alterna `Tema del sistema` → `Tema claro` → `Tema oscuro`. La preferencia se guarda en el navegador (`localStorage`, clave `gestask.theme`) y se aplica antes del primer pintado; sin almacenamiento disponible se sigue el tema del sistema.
- **Tokens**: colores, radios, sombras y tipografía se definen como variables CSS en `:root` y se redefinen para el tema oscuro. Los colores de estado de las tareas (`TASK_COLORS`, `PR_BORDER_COLORS`) se mantienen; en oscuro se mezclan con la superficie para conservar el tono sin perder contraste.
- **Cabecera de página**: sección del menú (antetítulo), nombre de la pestaña como título, descripción breve y acciones a la derecha. El título de la pestaña del navegador es `<Pestaña> · Gestask`.
- **Avisos**: los mensajes de éxito y error se muestran como avisos flotantes abajo a la derecha, sin desplazar el contenido. Los de éxito se cierran solos a los 5 segundos; los de error permanecen hasta cerrarlos o cambiar de pestaña. Ambos tienen botón de cerrar. En la pantalla de acceso, los errores (credenciales incorrectas, sesión caducada) se muestran sobre el formulario.
- **Sesión caducada**: con sesión abierta se comprueba su validez cada 5 minutos y al volver a la pestaña del navegador (si la última comprobación fue hace más de 1 minuto). Si el servidor rechaza la sesión, o una acción recibe `401`, se cierra la sesión, se descartan los datos cargados y los modales abiertos, y se muestra la pantalla de acceso con `Tu sesión ha caducado. Vuelve a iniciar sesión.` Si el servidor no responde (sin red), la sesión se mantiene y se vuelve a comprobar más tarde.
- **Modales**: cabecera fija al desplazar, `Escape` cierra el modal abierto y, al abrirse, el foco va al primer campo del formulario (`autofocus`) o al propio diálogo.
- **Teclado**: las filas y tarjetas que abren un detalle (tablas de tareas, Kanban, Horario diario, días del Calendario) se pueden enfocar con `Tab` y abrir con `Enter` o `Espacio`.
- **Estados**: carga con indicador giratorio, vacío con icono y texto, y tareas con cambios pendientes con la etiqueta `Creando...`/`Guardando...`.

## Backlog
Tabla responsive con colores por estado y borde por estado PR. Crear/editar usa modal compartido.

Filtros en una barra compacta: búsqueda, prioridad, fecha, campo y dirección de ordenación en una fila; debajo, los estados como chips seleccionables (con el color de cada estado y su descripción como tooltip), el interruptor `Histórico completo` y `Limpiar filtros (N)`, desactivado si no hay filtros.

Cada tarea ocupa una fila: la primera columna (`Tarea`) agrupa ticket, indicador de comentarios, título y más info; el resto de columnas muestran tipo (etiqueta de color: `Bug` rojo, `Feature` violeta, `Task` azul), fechas, scoring, orden y acciones. Los valores vacíos se muestran como `—`.

La vista debe permitir:
- Filtrar por estado, prioridad, fecha de inicio, búsqueda y tipo de ticket.
- Ordenar por puntos de orden, scoring, fecha de inicio, fecha límite, prioridad, estado, tipo y fechas técnicas.
- Mostrar `ticket_type`, `limit_date` y `scoring` cuando el ancho disponible lo permita.
- En móvil (≤ 760 px), cada tarea se muestra como una tarjeta con el título arriba y el resto de campos etiquetados en dos columnas, sin scroll horizontal.

## Indicador de comentarios en tablas de tareas
Todas las tablas de tareas (Backlog y Tareas Diarias) muestran, en la línea del ticket sobre el título de la tarea, un indicador con el número de comentarios que tiene. El indicador solo se muestra cuando la tarea tiene al menos un comentario.

## Modal de creación y edición de tarea
El título es el primer campo y recibe el foco al abrir el modal.

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
- El selector de tipo no ofrece `Diaria`: las tareas diarias se crean desde su pestaña con un modal simplificado (ticket, fecha de inicio, título, más info y, en edición, estado `Activa`/`Finalizada`).

## Detalle de tarea
El detalle debe ser ligeramente más compacto que la versión actual para incluir más información sin aumentar el tamaño del modal.

En escritorio:
- La rejilla mostrará 3 elementos por línea.
- Los campos largos pueden ocupar varias columnas cuando sea necesario.
- El modal debe reducir paddings y separación visual respecto a la versión actual.

En móvil:
- La rejilla puede pasar a 1 columna.
- Los comentarios deben seguir siendo accesibles al final del modal.

La cabecera muestra el ticket en el antetítulo, el título de la tarea y el botón `Editar`; el título no se repite en la rejilla. Estado y PR aparecen en la primera parte de la rejilla para cambiarlos sin desplazarse.

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
Selector de fecha con botones de día anterior y siguiente y `Hoy` (desactivado si ya se muestra hoy); cambiar la fecha carga el parte sin botón `Consultar`. Botón Nuevo día, aviso de modo histórico y listado ordenado por `order_points` descendente por defecto. La descripción de la cabecera indica la fecha del parte.

La vista debe permitir cambiar la ordenación usando los mismos criterios principales que Backlog cuando aplique.

La tabla del parte no muestra tareas `Diaria`. Al crear el parte, el mensaje de éxito indica cuántas diarias obligatorias se han añadido.

## Diarias
Pestaña propia para las tareas de tipo `Diaria`:
- Botón `Nueva tarea diaria`.
- Botón `Marcar todas como realizadas (N)`, visible solo con pendientes y con confirmación previa.
- Bloque `Pendientes de realizar` agrupado por fecha de parte, con etiqueta `Atrasada` o `Hoy` y casilla para marcar como realizada.
- Tabla `Activas` con acciones `Editar` y `Finalizar`.
- Sección plegable `Finalizadas` con acción `Reactivar`.

Detalle en `docs/10-daily-tasks.md`.

## Completar tareas
Pantalla operativa para cerrar tareas que ya están en `Done` pero cuyo workflow posterior no ha terminado.

La vista debe mostrar exclusivamente:
- Tareas `Bug` y `Feature` con `task_status = Done` y `pr_status` distinto de `Deployed`.
- Tareas `Task` con `task_status = Done` y `pr_status` distinto de `Imputed`.

La vista no debe incluir filtros, scoring visible como criterio ni controles de ordenación funcionales.

Encima de la tabla se muestran tres resúmenes con el número de tareas en cada paso (`Informar PR` / `Need PR`, `Imputar horas` / `Need to Impute`, `Cerrar` / `Imputed`), con el color de borde PR de cada estado.

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
- Acción de resolución cuando exista una transición disponible, con el nombre del paso: `Informar PR` (`Need PR`), `Imputar` (`Need to Impute`) o `Cerrar` (`Imputed`). Si el tipo de tarea no tiene ese paso, el botón aparece desactivado.

En la tabla `Pendientes de imputar` cada fila muestra ticket y título juntos en la columna `Tarea`.

### Resolver `Need PR`
Aplica a tareas `Bug` y `Feature` en `pr_status = Need PR`.

Al pulsar la acción de resolución, debe abrirse un popup con:
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

Al pulsar la acción de resolución, debe abrirse un popup con:
- Hipervínculo al ticket.
- Título de la tarea.
- Fecha de resolución, tomada de `finished_date`.
- Cantidad de horas que se deben imputar.
- `Hora Jira`, con botón para copiarla al portapapeles.
- Campo de tipo `date` llamado `imputed_date`.
- Botón de confirmar.
- Botón de cancelar.

Reglas:
- `imputed_date` aparece inicialmente con el mismo valor que `finished_date`.
- `imputed_date` es editable antes de confirmar.
- `Hora Jira` tiene el formato `3h 30m 08/oct/26 08:00 AM`: horas a imputar sin revisar, `finished_date` como `dd/mmm/aa` con el mes abreviado en español y hora fija `08:00 AM`.
- `Hora Jira` no depende de `imputed_date` y no se muestra si la tarea no tiene `finished_date`.
- Copiar no cierra el popup ni descarta los cambios del formulario.
- Tras confirmar, la tarea pasa a `pr_status = Imputed`.

### Copiar para Jira
Aplica a las tareas en `pr_status = Need to Impute`.

El panel `Pendientes de imputar` muestra el botón `Copiar para Jira (N)`, que copia al portapapeles una línea por tarea para pegarlas de una vez:

```text
ATSI0943-2500 3h 30m 08/oct/26 08:00 AM
ATSI0943-2501 4h 09/oct/26 08:00 AM
```

Reglas:
- Cada línea es el ticket seguido de `Hora Jira`, por lo que usa las horas a imputar sin revisar.
- Incluye todas las tareas pendientes de imputar, con independencia de la selección de la tabla, ordenadas por fecha de finalización ascendente.
- Las tareas sin ticket, sin `finished_date` o sin horas no se copian; si hay alguna, el panel indica cuántas.
- Copiar no cambia el estado de ninguna tarea ni requiere abrir la tabla.

### Resolver `Imputed`
Aplica solo a tareas `Bug` y `Feature` en `pr_status = Imputed`.

Al pulsar la acción de resolución, debe abrirse un popup con:
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

Arriba del todo, antes de la agenda, se muestra el bloque `Tareas diarias` con las diarias del parte, su progreso `realizadas / total` y una casilla por tarea. Las diarias no ocupan franjas horarias.

Las franjas se dibujan como una línea de tiempo: hora de inicio y fin a la izquierda, un punto por franja (principal para tareas, verde para descanso, azul para `Daily`) y la tarjeta con el color de estado de la tarea.

Al final del listado se muestra un botón a todo el ancho disponible para incluir horas extra:
- Borde discontinuo, fondo transparente y texto atenuado; al pasar el ratón toma el tono principal.
- Altura aproximada de 3 líneas de texto.
- Texto `Incluir horas` con un icono `+` cuando está desactivado y `Mostrar menos horas` cuando está activado.
- Al activarlo, la hora de fin efectiva se amplía `PE_diario_extra` puntos de esfuerzo y se planifican tareas adicionales por encima de la hora de fin.
- Al desactivarlo, se vuelve a la jornada base y se eliminan las tareas de la franja extra.

El detalle de comportamiento y los casos límite están en `docs/09-daily-schedule.md`.

## Calendario
Grid mensual de días laborables (lunes a viernes) con leyenda de colores. Navegación con mes anterior/siguiente, selector de mes, año y `Mes actual`; cambiar mes o año carga el periodo sin botón `Consultar`.

Cada día muestra su número, el estado si no es laborable, `Hoy` en el día actual, los puntos completados frente al objetivo con una barra de progreso, las horas, la observación y las tareas finalizadas. Colores:
- Verde: objetivo cumplido. Rojo: por debajo del objetivo. Gris con borde discontinuo: no laborable.
- Hoy: fondo amarillo y contorno del color principal.
- Días futuros: neutros (sin verde ni rojo), porque aún no se han trabajado.

El nombre del día de la semana solo se repite dentro de la tarjeta en móvil, donde no hay cabecera de columnas. Los días editables abren el popup de tipo de día con clic o teclado.

## Gráficas de Rendimiento
Vista con métricas y gráficas del mes consultado.

### Bloque de métricas
La barra superior contiene el selector de mes (igual que en `Calendario`) y el interruptor `Mostrar todo`. Debajo, las métricas se agrupan en cuatro paneles: `Tareas` (abiertas, terminadas, listas para cierre), `Esfuerzo` (PE completados, PE totales del mes, % completado del mes, horas completadas), `Ritmo` (% actual del mes, % completado hasta ahora, ratio de diferencia) y `Calendario` (días laborables e intensivos). Con `Mostrar todo` se ocultan las métricas que dependen del mes. Este bloque es siempre visible, independientemente del grupo de gráficas seleccionado.

### Gráficas de distribución siempre visibles
Encima del área de grupos se muestran, siempre visibles y como barras horizontales, las gráficas categóricas de distribución:
- Estados de tarea
- Prioridad

### Organización de las gráficas por grupos
El resto de gráficas (series por día) se dividen en grupos diferenciados. Encima del área de gráficas hay un selector segmentado con un elemento por grupo; al seleccionar un grupo se muestran únicamente sus gráficas debajo. Por defecto se muestra el primer grupo (`Rendimiento de puntos`).

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
- Indicador de valor fijo (`Fijo`) o personalizado (`Personalizado`, cuando difiere del valor por defecto).
- Control de edición adecuado al tipo.

Los parámetros con `fixed_value = true` se muestran en solo lectura y siempre usan el valor por defecto.

La creación de parámetros debe solicitar `name`, `parameter_type`, `default_value` y `fixed_value`.

Los parámetros `scoring_*` deben mostrarse igual que el resto, aunque se recomienda agruparlos visualmente bajo una sección `Scoring` si la lista crece.

## Colores
- Principal: `#ff8000` (botones principales con texto oscuro para mantener el contraste).
- Secundario: `#ffdbb6` (pestaña activa en tema claro).
- Estados según requisitos del backlog y calendario.
- Tema oscuro: superficies cálidas oscuras y los mismos colores de estado mezclados con la superficie (`--task-tint`).

## Responsive
En móvil, las tablas de tareas (Backlog, Tareas diarias y Completar tareas) se convierten en tarjetas; el resto de tablas se desplazan horizontalmente. Los formularios y rejillas pasan a una columna y los filtros a dos por fila. Por debajo de 760 px el menú lateral se convierte en una barra superior fija con el botón de menú, la marca y los indicadores; el botón abre las pestañas en un panel lateral sobre el contenido, que se cierra al elegir una pestaña, al pulsar fuera o con `Escape`. En móvil no existe el modo plegado.
