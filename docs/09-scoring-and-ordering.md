# Scoring y Ordenación

## Objetivo
Definir cómo se calcula el scoring de una tarea y cómo se ordenan los listados usando criterios configurables y campos existentes.

El scoring sirve para priorizar tareas combinando urgencia, antigüedad, esfuerzo, prioridad, orden manual, tipo de ticket y proximidad de fecha límite.

## Principios
- El cálculo debe ser determinista.
- El scoring debe poder explicarse a partir de los campos de la tarea y la configuración efectiva del usuario.
- La ausencia de una configuración `scoring_*` no debe romper el listado.
- Los multiplicadores se leen desde Configuración y pueden tener valor por usuario.
- El resultado debe poder usarse para ordenar en Backlog y Tareas Diarias.

## Entradas del cálculo

Campos de tarea:
- `ticket_type`.
- `priority`.
- `effort_points`.
- `order_points`.
- `assigned_date`.
- `limit_date`.
- `task_status`.
- `pr_status`.
- `created_at`.
- `updated_at`.

Configuración:
- Todo multiplicador debe empezar por `scoring_`.
- Los valores deben ser numéricos.
- La configuración efectiva del usuario tiene prioridad sobre el valor por defecto si el parámetro no es fijo.

## Multiplicadores base

| Parámetro | Valor por defecto recomendado | Descripción |
|---|---:|---|
| `scoring_dias_pasadas` | `0.05` | Peso por cada día desde `assigned_date` sin finalizar. |
| `scoring_prioridad` | `5` | Peso base aplicado al nivel numérico de prioridad. |
| `scoring_puntos_esfuerzo` | `1` | Peso aplicado a `effort_points`. |
| `scoring_orden` | `1` | Peso aplicado a `order_points`. |
| `scoring_dias_limites` | `5` | Peso de proximidad o vencimiento de `limit_date`. |
| `scoring_tipo_bug` | `1` | Multiplicador por tipo `Bug`. |
| `scoring_tipo_feature` | `1` | Multiplicador por tipo `Feature`. |
| `scoring_tipo_task` | `1` | Multiplicador por tipo `Task`. |
| `scoring_estado_waiting` | `-1` | Ajuste para tareas bloqueadas o en espera. |
| `scoring_estado_need_fix` | `2` | Ajuste para tareas que requieren corrección. |
| `scoring_estado_warning` | `1` | Ajuste para tareas en aviso. |

## Conversión de prioridad

| Prioridad | Valor numérico |
|---|---:|
| `Trivial` | `1` |
| `Menor` | `2` |
| `Prioritaria` | `3` |
| `Crítica` | `4` |
| `Bloqueante` | `5` |

## Fórmula recomendada

```text
scoring =
  (priority_value * scoring_prioridad) +
  (effort_points * scoring_puntos_esfuerzo) +
  (order_points_or_zero * scoring_orden) +
  (days_since_assigned * scoring_dias_pasadas) +
  (limit_date_factor * scoring_dias_limites) +
  status_adjustment

scoring = scoring * ticket_type_multiplier
```

Donde:
- `order_points_or_zero` es `0` si `order_points` es `null`.
- `days_since_assigned` es `0` si `assigned_date` está en el futuro.
- `limit_date_factor` es `0` si `limit_date` es `null`.
- `ticket_type_multiplier` se obtiene de `scoring_tipo_bug`, `scoring_tipo_feature` o `scoring_tipo_task`.
- `status_adjustment` suma ajustes específicos de estado si existen.

## Cálculo de `limit_date_factor`

Regla recomendada:
- Si `limit_date` es `null`, usar `0`.
- Si la tarea está vencida, usar `1 + días_vencida`.
- Si la tarea vence hoy, usar `1`.
- Si vence en el futuro, usar `1 / días_restantes`.

Esto hace que una tarea vencida pese más que una tarea simplemente próxima.

## Estados finales
Las tareas en estados finales pueden recibir scoring `0` o quedar excluidas de listados operativos según la pantalla.

Estados considerados no operativos:
- `Done`.
- `Undone`.
- `Unfinished`.

Si una pantalla muestra estados finales, debe seguir mostrando el scoring calculado o `0`, pero el comportamiento debe ser consistente en esa pantalla.

## Ordenación

Parámetros API:
- `sort_by`.
- `sort_direction`.

Valores permitidos de `sort_by`:
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

Valores permitidos de `sort_direction`:
- `asc`.
- `desc`.

Orden por defecto recomendado:
- Backlog: `created_at desc` si no se indica criterio.
- Tareas Diarias: `order_points desc`, manteniendo el comportamiento actual.
- Vista priorizada: `scoring desc`.

## Desempates
Cuando dos tareas tengan el mismo valor en el campo de ordenación:
- Usar `created_at desc` como primer desempate.
- Usar `id asc` como desempate final estable.

## Ordenación de nulos
Reglas recomendadas:
- `limit_date null` debe ir al final al ordenar por fecha límite ascendente.
- `order_points null` debe tratarse como `0` para scoring y como nulo al ordenar directamente por puntos.
- `finished_date null` debe ir al final si se añade como criterio futuro.

## Reordenación manual operativa

La pestaña `Ordenar tareas` usa `order_points` como valor persistido de prioridad manual.

Alcance:
- Solo tareas con `task_status` distinto de `Done`, `Undone` y `Unfinished`.
- Solo tareas con `order_points` no nulo.
- Orden visual descendente por `order_points`.

### Movimiento hacia abajo
Si una tarea se mueve desde una posición superior a una posición inferior:
- La tarea movida toma el `order_points` de la tarea que queda justo encima en la nueva posición.
- Las tareas desplazadas entre la posición original y la nueva posición incrementan su `order_points` en `1`.
- Las tareas fuera del tramo afectado no cambian.

Ejemplo:

| Antes | Orden |
|---|---:|
| A | 5 |
| B | 4 |
| C | 3 |
| D | 2 |
| E | 1 |

Mover `B` debajo de `D` produce:

| Después | Orden |
|---|---:|
| A | 5 |
| C | 4 |
| D | 3 |
| B | 2 |
| E | 1 |

### Movimiento hacia arriba
Si una tarea se mueve desde una posición inferior a una posición superior:
- La tarea movida toma el `order_points` de la tarea que queda justo debajo en la nueva posición.
- Las tareas desplazadas entre la nueva posición y la posición original decrementan su `order_points` en `1`.
- Las tareas fuera del tramo afectado no cambian.

Ejemplo:

| Antes | Orden |
|---|---:|
| A | 5 |
| B | 4 |
| C | 3 |
| D | 2 |
| E | 1 |

Mover `D` encima de `B` produce:

| Después | Orden |
|---|---:|
| A | 5 |
| D | 4 |
| B | 3 |
| C | 2 |
| E | 1 |

### Ordenar automaticamente
La acción `Ordenar automaticamente` normaliza los `order_points` visibles a una secuencia sin huecos.

Regla:
- Ordenar las tareas por `order_points` ascendente.
- Asignar `1` a la menor.
- Asignar `2` a la siguiente.
- Continuar hasta `N`.

Ejemplo:
- Si la menor tiene `3`, pasa a `1`.
- Si la siguiente tiene `5`, pasa a `2`.
- La tarea con mayor `order_points` queda con `N`.

### Eficiencia
- La UI debe calcular el diff local de `id` y `order_points`.
- La API debe recibir todos los cambios en una única llamada batch.
- No se debe hacer una llamada por tarea.
- La API debe validar todo antes de escribir para evitar estados parciales.

## Responsabilidades técnicas

### SQL
- Añadir columnas `limit_date`, `ticket_type` y `comments`.
- Añadir constraints de catálogo.
- Adaptar trigger de normalización de estado para `ticket_type = Task`.
- Añadir índices recomendados para filtros y ordenación.

### Edge Functions
- Aceptar y validar campos nuevos en create/update.
- Calcular o recuperar `scoring` en listados.
- Validar `sort_by` y `sort_direction`.
- Aplicar ordenación estable.
- Leer multiplicadores desde configuración efectiva del usuario.
- Listar tareas ordenables para `Ordenar tareas`.
- Aplicar actualizaciones batch de `order_points` en una única operación lógica.

### Frontend
- Añadir filtros y controles de ordenación.
- Mostrar `limit_date`, `ticket_type` y `scoring` donde corresponda.
- Adaptar modal de tarea.
- Adaptar detalle de tarea a 3 columnas.
- Añadir sección de comentarios persistidos.
- Añadir pestaña `Ordenar tareas` con acciones subir, bajar y `Ordenar automaticamente`.

## Casos de prueba manual
- Crear tarea sin `limit_date`; debe guardarse con `null`.
- Crear tarea sin `ticket_type`; debe guardarse como `Bug`.
- Crear tarea `Task`; el selector PR solo permite `Not Finished`, `Need to Impute` e `Imputed`.
- Cambiar una tarea `Bug` a `Task`; un PR incompatible se normaliza.
- Añadir comentario desde detalle; al reabrir la tarea, el comentario sigue visible.
- Ordenar por scoring descendente; las tareas con mayor scoring aparecen primero.
- Ordenar por fecha límite ascendente; tareas sin fecha límite aparecen al final.
- Cambiar `scoring_prioridad`; el scoring cambia sin modificar tareas.
- Abrir `Ordenar tareas`; solo aparecen tareas no finales con `order_points` informado.
- Mover una tarea hacia abajo; la tarea movida toma el orden de la tarea superior resultante y el tramo desplazado incrementa su orden en `1`.
- Mover una tarea hacia arriba; la tarea movida toma el orden de la tarea inferior resultante y el tramo desplazado decrementa su orden en `1`.
- Ejecutar `Ordenar automaticamente`; los `order_points` quedan normalizados de `1` a `N` sin huecos.
- Verificar que cada reordenación se envía en una única llamada batch.
