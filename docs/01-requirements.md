# Requisitos

## Funcionales
- Registro e inicio de sesión mediante Edge Functions `auth-register` y `auth-login`.
- Dashboard protegido por sesión.
- Backlog CRUD básico: listar, crear, editar y cambiar estados.
- Enlace a Jira para tickets.
- Parte diario único por usuario y fecha.
- Consulta de partes diarios por fecha con modo histórico de solo lectura.
- Calendario mensual con puntos completados y tareas/tickets finalizados.
- Marcado de Laboral, Vacaciones, Festivos y Ausencia.
- Pestaña de Configuración para consultar, modificar y crear parámetros configurables.
- Placeholders para Gestor de Tiempos y Gráficas.

## No funcionales
- Responsive.
- Sin claves privadas en cliente.
- RLS obligatorio.
- Errores claros.
- Código simple y extensible.

## Flujos principales
- Usuario se registra o inicia sesión.
- Accede a Backlog y crea tareas.
- Cambia una tarea a `Done`; se asigna `finished_date` y `pr_status = Need PR` si procede.
- Crea un nuevo parte diario; las tareas pendientes del parte anterior pasan a `Unfinished`.
- Consulta días anteriores en modo histórico.
- Visualiza el calendario mensual y marca ausencias o vacaciones.
- Accede a Configuración, modifica valores propios y crea nuevos parámetros configurables.

## Reglas de negocio
- Estados de tarea: `To do`, `Doing`, `Draft`, `Undone`, `Unfinished`, `Need Fix`, `Waiting`, `Done`, `Warning`.
- Estados PR: `Not Finished`, `Need PR`, `PR Hecho`, `Imputed`, `Deployed`.
- Prioridades: `Trivial`, `Menor`, `Prioritaria`, `Crítica`, `Bloqueante`.
- Si `task_status != Done`, `pr_status` debe ser `Not Finished` y `finished_date` debe ser `null`.
- Si `task_status` pasa a `Done`, `finished_date` se rellena si estaba vacía y `pr_status` pasa a `Need PR` si estaba en `Not Finished`.
- Solo existe un parte diario por usuario y fecha.
- Tareas válidas para parte diario: `To do`, `Doing`, `Draft`, `Need Fix`, `Waiting`, `Warning`.
- Tareas no cargadas: `Done`, `Undone`, `Unfinished`.
- Sábados y domingos son `Finde`.
- Si un parámetro no tiene perfil de usuario, se devuelve el `default_value` sin insertar registro personalizado.
- Si `fixed_value = true`, se devuelve siempre el `default_value`, se ignora cualquier valor personalizado existente y el campo queda en solo lectura.
- Solo se persisten valores de configuración de usuario cuando difieren del valor por defecto.

## Permisos
Cada usuario solo puede ver y modificar sus perfiles, tareas, partes diarios y estados de calendario.

Cada usuario solo puede ver y modificar sus valores propios de configuración. La creación de parámetros globales de configuración debe estar protegida.

## Casos límite y validaciones
- Email/password obligatorios.
- Título de tarea obligatorio.
- `effort_points >= 0`.
- Rechazar estados fuera de catálogo.
- Duplicado de parte diario devuelve `El parte diario está ya creado`.
- Fecha de consulta inválida devuelve 400.
- `parameter_type` de configuración debe pertenecer al catálogo de tipos primitivos permitido.
- `default_value` y `value` deben ser válidos para el `parameter_type` configurado.
