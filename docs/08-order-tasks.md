# Ordenar tareas

## Estado
Implementado. Pendiente validación manual completa en navegador contra Supabase desplegado.

## Objetivo
Crear una pestaña `Ordenar tareas` para ajustar el orden manual de ejecución de las tareas operativas usando `order_points`, sin editar tareas una por una y evitando llamadas repetidas al servidor.

## Alcance funcional
La vista debe mostrar todas las tareas que cumplan:
- `task_status` distinto de `Done`, `Undone` y `Unfinished`.
- `order_points` informado.
- Pertenecen al usuario autenticado.

La vista no debe mostrar:
- Tareas finalizadas o descartadas.
- Tareas sin puntos de orden.
- Tareas de otros usuarios.

## Orden visual
El listado se muestra siempre de mayor a menor `order_points`.

Desempate recomendado:
- `created_at desc`.
- `id asc`.

## Acciones de usuario

### Mover arriba
Mueve una tarea una posición hacia arriba en el listado visual.

Reglas:
- No disponible para la primera tarea.
- La tarea movida toma el `order_points` de la tarea que queda justo debajo en la nueva posición.
- Las tareas desplazadas hacia abajo hasta la posición original decrementan `order_points` en `1`.

### Mover abajo
Mueve una tarea una posición hacia abajo en el listado visual.

Reglas:
- No disponible para la última tarea.
- La tarea movida toma el `order_points` de la tarea que queda justo encima en la nueva posición.
- Las tareas desplazadas hacia arriba hasta la nueva posición incrementan `order_points` en `1`.

### Ordenar automaticamente
Normaliza todos los `order_points` de las tareas visibles a una secuencia continua.

Reglas:
- Ordenar por `order_points` ascendente.
- La menor recibe `1`.
- La siguiente recibe `2`.
- Continuar hasta `N`.
- La tarea con mayor orden queda con `N`.

Ejemplo:
- Ordenes iniciales: `3`, `5`, `9`.
- Resultado automático: `1`, `2`, `3`, respetando el orden relativo inicial.

## Algoritmo esperado

### Entrada local
La UI parte de una lista ya ordenada descendente por `order_points`.

```text
[
  { id: A, order_points: 5 },
  { id: B, order_points: 4 },
  { id: C, order_points: 3 },
  { id: D, order_points: 2 },
  { id: E, order_points: 1 }
]
```

### Movimiento hacia abajo
Mover `B` debajo de `D`:

```text
Antes:   A 5, B 4, C 3, D 2, E 1
Después: A 5, C 4, D 3, B 2, E 1
```

Cambios enviados:

```json
{
  "updates": [
    { "id": "B", "order_points": 2 },
    { "id": "C", "order_points": 4 },
    { "id": "D", "order_points": 3 }
  ]
}
```

### Movimiento hacia arriba
Mover `D` encima de `B`:

```text
Antes:   A 5, B 4, C 3, D 2, E 1
Después: A 5, D 4, B 3, C 2, E 1
```

Cambios enviados:

```json
{
  "updates": [
    { "id": "D", "order_points": 4 },
    { "id": "B", "order_points": 3 },
    { "id": "C", "order_points": 2 }
  ]
}
```

## Contrato técnico previsto

### Listado
Endpoint previsto:

```text
GET /functions/v1/tasks-order-list
```

Respuesta:

```json
{
  "tasks": [
    {
      "id": "uuid",
      "ticket": "ABC-123",
      "ticket_type": "Bug",
      "title": "Título",
      "order_points": 8,
      "priority": "Prioritaria",
      "task_status": "Doing",
      "assigned_date": "2026-06-09",
      "limit_date": null
    }
  ]
}
```

### Actualización batch
Endpoint previsto:

```text
PATCH /functions/v1/tasks-order-update
```

Payload:

```json
{
  "updates": [
    { "id": "uuid", "order_points": 4 }
  ]
}
```

Reglas técnicas:
- Una única llamada por operación de reordenación.
- Validar todas las tareas antes de escribir.
- No aplicar cambios parciales.
- Devolver la lista actualizada si es viable para evitar una llamada adicional.
- Mantener RLS y filtro por usuario autenticado.

## Consideraciones de eficiencia
- La UI debe calcular el diff y enviar solo tareas afectadas.
- `Ordenar automaticamente` puede enviar todas las tareas visibles si todas cambian.
- No se debe iterar con una llamada HTTP por tarea.
- Si se implementa en Supabase, la Edge Function puede usar una operación batch o transacción para garantizar consistencia.

## UI esperada
La pestaña debe integrarse en la navegación superior con el texto `Ordenar tareas`.

La pantalla debe incluir:
- Título `Ordenar tareas`.
- Descripción breve de que solo aparecen tareas pendientes con puntos de orden.
- Tabla o lista responsive.
- Botones de subir y bajar por fila.
- Botón principal o secundario `Ordenar automaticamente`.
- Estado de carga.
- Estado vacío cuando no existan tareas ordenables.
- Mensaje de éxito al guardar.
- Mensaje de error al fallar.

## Validaciones
- Rechazar IDs duplicados.
- Rechazar `order_points` no enteros.
- Rechazar tareas sin `order_points`.
- Rechazar tareas con `task_status` `Done`, `Undone` o `Unfinished`.
- Rechazar tareas inexistentes o de otro usuario.
- Rechazar payload vacío.

## Casos de prueba manual
- Abrir `Ordenar tareas` con tareas en varios estados; solo aparecen las no finales con `order_points`.
- Verificar que el listado aparece en orden descendente por `order_points`.
- Verificar que la primera tarea no permite subir.
- Verificar que la última tarea no permite bajar.
- Mover una tarea hacia abajo y comprobar que solo cambia el tramo afectado.
- Mover una tarea hacia arriba y comprobar que solo cambia el tramo afectado.
- Pulsar `Ordenar automaticamente` y comprobar que los puntos quedan de `1` a `N`.
- Confirmar que cada operación realiza una única llamada batch.
- Forzar error de API y comprobar que la UI muestra error y no deja un orden visual engañoso.
