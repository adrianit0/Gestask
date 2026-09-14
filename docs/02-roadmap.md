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

## Iteración 11
- Documentar la funcionalidad `Horario diario` bajo SDD (`docs/09-daily-schedule.md`).
- Añadir el parámetro `PE_diario_extra` al catálogo de configuración (defecto `3`).
- Implementar el botón "Incluir horas" / "Mostrar menos horas" que amplía la hora de fin efectiva por `PE_diario_extra` PE.

## Iteración 12
- Documentar el tipo de tarea `Diaria` bajo SDD (`docs/10-daily-tasks.md`).
- Añadir `Diaria` al catálogo de `ticket_type` y `completed_at` a `daily_report_tasks` (`script-011.sql`).
- Añadir las diarias activas a cada parte diario y exponer endpoints de pendientes y marcado.
- Implementar la pestaña `Diarias`, el bloque de diarias en `Horario diario` y el indicador de cabecera de aviso/error.
