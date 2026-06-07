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

### Frontend
- Añadir filtros y controles de ordenación.
- Mostrar `limit_date`, `ticket_type` y `scoring` donde corresponda.
- Adaptar modal de tarea.
- Adaptar detalle de tarea a 3 columnas.
- Añadir sección de comentarios persistidos.

## Casos de prueba manual
- Crear tarea sin `limit_date`; debe guardarse con `null`.
- Crear tarea sin `ticket_type`; debe guardarse como `Bug`.
- Crear tarea `Task`; el selector PR solo permite `Not Finished`, `Need to Impute` e `Imputed`.
- Cambiar una tarea `Bug` a `Task`; un PR incompatible se normaliza.
- Añadir comentario desde detalle; al reabrir la tarea, el comentario sigue visible.
- Ordenar por scoring descendente; las tareas con mayor scoring aparecen primero.
- Ordenar por fecha límite ascendente; tareas sin fecha límite aparecen al final.
- Cambiar `scoring_prioridad`; el scoring cambia sin modificar tareas.
