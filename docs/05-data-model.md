# Modelo de Datos

## profiles
Perfil público de usuario vinculado a `auth.users`.

## tasks
Backlog del usuario. Incluye prioridad, estado de tarea, estado PR, esfuerzo, orden y fechas.

## daily_reports
Parte diario único por usuario y fecha.

## daily_report_tasks
Relación histórica entre partes diarios y tareas.

## calendar_day_statuses
Excepciones manuales del calendario: Laboral, Vacaciones, Festivos, Ausencia.

## Reglas automáticas
- Trigger `normalize_task_state` mantiene coherencia entre `task_status`, `finished_date` y `pr_status`.
- Trigger `sync_task_with_today_report` añade tareas válidas al parte de hoy si existe.
- Trigger `touch_updated_at` actualiza `updated_at`.
