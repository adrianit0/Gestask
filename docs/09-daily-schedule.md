# Horario diario

## Objetivo
La pestaña `Horario diario` transforma las tareas del parte diario en una agenda con franjas horarias, partiendo de la jornada laboral configurada (hora de inicio, hora de fin, descanso y puntos de esfuerzo diarios).

Esta especificación documenta el comportamiento de la vista y, en concreto, la funcionalidad de **incluir horas extra** para planificar más allá de la hora de fin habitual.

## Tareas diarias
- Arriba del todo, antes del horario, se muestra el bloque `Tareas diarias` con las tareas de tipo `Diaria` del parte y una casilla para marcarlas como realizadas.
- Las tareas `Diaria` no forman parte de la agenda: no tienen PE ni ocupan franjas horarias.
- El comportamiento completo está en `docs/10-daily-tasks.md`.

## Construcción del horario
- Las tareas se ordenan por `order_points` descendente.
- Cada tarea ocupa un bloque de duración `effort_points * Minute_PE` minutos.
- El horario empieza con un bloque `Daily` y, en jornada no intensiva, inserta un bloque `Descanso`.
- Se planifican tareas mientras quede tiempo entre la hora de inicio y la hora de fin efectiva.
- Las tareas que no caben antes de la hora de fin efectiva no se muestran.

## Parámetros de jornada relevantes
| Parámetro | Tipo | Defecto | Uso |
|---|---|---|---|
| `hora_inicio` | string | `8:00` | Inicio de la jornada. |
| `hora_fin` | string | `17:30` | Fin base de la jornada. |
| `Minute_PE` | number | `60` | Minutos por punto de esfuerzo (PE). |
| `PE_diario_extra` | number | `3` | PE adicionales que se añaden al pulsar "Incluir horas". |

`Minute_PE` puede personalizarse por usuario; en el entorno del usuario está configurado a `40`.

## Funcionalidad: Incluir horas extra

### Botón de inclusión
- Se muestra al final del listado del horario, ocupando todo el ancho disponible.
- Estilo: borde gris con transparencia y línea discontinua, fondo blanco con mucha transparencia, texto gris.
- Altura aproximada de 5 veces la altura del texto.
- Texto inicial: `(+) Incluir horas`.

### Comportamiento de alternancia
- Estado inicial: desactivado (no se añaden horas extra).
- Al pulsar el botón estando desactivado:
  - Se amplía la hora de fin efectiva en `PE_diario_extra` puntos de esfuerzo.
  - Cada PE equivale a `Minute_PE` minutos, por lo que la ampliación es `PE_diario_extra * Minute_PE` minutos.
  - Las tareas que no cabían antes se planifican en la franja extra, por encima de la hora de fin.
  - El texto del botón pasa a `Mostrar menos horas`.
- Al pulsar el botón estando activado:
  - Se vuelve a la hora de fin base.
  - Se eliminan del horario las tareas planificadas en la franja extra.
  - El texto del botón vuelve a `(+) Incluir horas`.

### Ejemplo
Con `hora_fin = 17:30`, `PE_diario_extra = 3` y `Minute_PE = 40`:
- Ampliación = `3 * 40 = 120` minutos.
- Hora de fin efectiva al incluir horas = `19:30`.
- El resumen superior muestra el rango con la hora de fin efectiva (`19:30`).

### Reglas y casos límite
- `PE_diario_extra` debe ser numérico y mayor que cero; si no, se usa el valor por defecto `3`.
- La inclusión de horas extra es un estado de UI: no persiste y no modifica la jornada configurada.
- En jornada intensiva no hay descanso; la franja extra se añade igualmente tras la hora de fin intensiva.
- Si no existen tareas pendientes que planificar, el botón sigue mostrándose pero el horario no añade bloques nuevos.
