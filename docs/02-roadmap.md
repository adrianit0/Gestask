# Roadmap

## Iteración 1
- Autenticación.
- Layout base.
- Navegación fija superior.
- Modelo SQL inicial.
- Backlog CRUD básico.

## Iteración 2
- Edición inline de estados.
- Reglas automáticas de fecha de finalización.
- Reglas automáticas de estado PR.
- Filtros y ordenación.

## Iteración 3
- Tareas diarias.
- Creación de parte diario.
- Consulta de días anteriores.
- Sincronización automática entre backlog y parte diario.

## Iteración 4
- Calendario mensual.
- Estados de día.
- Vacaciones, festivos y ausencias.
- Puntos de esfuerzo por día.

## Iteración 5
- Gestor de tiempos.
- Horarios por tarea.
- Gráficas de rendimiento.

## Iteración 6
- Pestaña Configuración con icono de rueda dentada.
- Catálogo `gestask_configuration`.
- Valores por usuario en `gestask_configuration_profile`.
- Lectura con fallback a `default_value`.
- Soporte de parámetros fijos de solo lectura.

## Iteración 7
- Añadir `limit_date` y `ticket_type` al modelo de tareas.
- Adaptar reglas de estado PR para `ticket_type = Task`.
- Ampliar formularios, tablas y detalle de tarea.
- Añadir comentarios persistidos dentro de la tarea.

## Iteración 8
- Sistema de scoring configurable por multiplicadores `scoring_*`.
- Exponer scoring calculado en API y UI.
- Ordenación avanzada por orden, scoring, fechas, prioridad, estado y tipo.
- Validación manual y casos límite del nuevo ordenamiento.

## Iteración 9
- Documentar la funcionalidad `Completar tareas`.
- Añadir modelo de datos previsto para `pr_link`, `test_cases` e `imputed_date`.
- Definir endpoints futuros para listar y resolver tareas pendientes de cierre.
- Implementar la pestaña `Completar tareas` y sus popups guiados cuando se autorice el desarrollo.

## Iteración 10
- Documentar la funcionalidad `Ordenar tareas` bajo SDD.
- Definir reglas de inclusión, orden visual y reordenación por `order_points`.
- Definir endpoint batch para actualizar el orden en una única llamada.
- Definir UI de listado con acciones subir, bajar y `Ordenar automaticamente`.
- Implementar la pestaña `Ordenar tareas` cuando se autorice el desarrollo.
