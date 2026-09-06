# Configuración

## Objetivo
Añadir una pestaña protegida llamada `Configuración`, accesible desde la navegación principal mediante un icono de rueda dentada.

La pestaña permite al usuario consultar y modificar sus parámetros de configuración, y también crear nuevos parámetros disponibles para configuración.

Esta documentación define el comportamiento esperado y las reglas que deben seguir los parámetros usados por el sistema de scoring.

## Navegación
- Nueva pestaña: `Configuración`.
- Icono: rueda dentada.
- Ubicación: navegación principal junto al resto de secciones protegidas.
- Acceso: solo usuarios autenticados.

## Modelo de datos

### gestask_configuration
Catálogo global de parámetros configurables.

| Campo | Tipo esperado | Descripción |
|---|---|---|
| `id` | identificador | Identificador único del parámetro. |
| `name` | texto | Nombre legible y único del parámetro. |
| `parameter_type` | texto/catalogado | Tipo primitivo del valor. |
| `default_value` | texto | Valor por defecto serializado según `parameter_type`. |
| `fixed_value` | booleano | Si es `true`, el valor queda fijado al valor por defecto. |

### gestask_configuration_profile
Valor personalizado de un parámetro para un usuario.

| Campo | Tipo esperado | Descripción |
|---|---|---|
| `configuration_id` | referencia | Referencia a `gestask_configuration.id`. |
| `user_id` | referencia | Usuario propietario del valor. |
| `value` | texto | Valor personalizado serializado según `parameter_type`. |

## Tipos de parámetro
`parameter_type` usará tipos primitivos típicos:
- `string`
- `number`
- `boolean`
- `date`
- `datetime`

El valor almacenado en `default_value` y `value` debe poder validarse y convertirse al tipo indicado por `parameter_type`.

## Parámetros de scoring
Todo parámetro usado por el sistema de scoring debe empezar por `scoring_`.

Ejemplos:
- `scoring_dias_pasadas = 0.05`
- `scoring_prioridad = 5`
- `scoring_puntos_esfuerzo = 1`
- `scoring_orden = 1`
- `scoring_dias_limites = 5`
- `scoring_tipo_bug = 1`
- `scoring_tipo_feature = 1`
- `scoring_tipo_task = 1`
- `scoring_estado_waiting = -1`
- `scoring_estado_need_fix = 2`

Reglas:
- Los parámetros `scoring_*` deben usar `parameter_type = number` salvo que se documente otra necesidad.
- Si un parámetro de scoring no existe, el cálculo debe usar un valor por defecto definido en `docs/07-scoring.md`.
- Los usuarios pueden personalizar multiplicadores si el parámetro no está marcado como fijo.
- Los parámetros fijos permiten bloquear multiplicadores globales.

## Parámetros de horario diario
La vista `Horario diario` (ver `docs/09-daily-schedule.md`) usa parámetros de jornada del catálogo:
- `hora_inicio`, `hora_fin`, `hora_descanso`, `duracion_descanso`.
- `PE_diario`, `Minute_PE`.
- Variantes intensivas: `hora_inicio_intensivo`, `hora_fin_intensivo`, `PE_diario_intensivo`, `dias_semana_intensivo`, `meses_intensivo`.
- `PE_diario_extra` (`number`, defecto `3`): puntos de esfuerzo adicionales que se planifican al activar la opción "Incluir horas". Si no es numérico o no es mayor que cero, se usa el valor por defecto.

## Parámetros de proyecto
Estos parámetros permiten usar la aplicación sin depender de Jira, de forma independiente por cuenta.

### project-external-page
- Tipo: `string`. Valor por defecto: `https://jira.knowmadmood.com/browse/`.
- Define la URL base usada para construir el enlace del ticket.
- Si el valor contiene `{ticket}`, se sustituye por el ticket codificado; en caso contrario el ticket se añade al final de la URL.
- Si el valor está en blanco o el parámetro no existe, no se generan enlaces y el ticket se muestra como texto plano (la cuenta no tiene conectado ningún programa externo).
- Afecta a `Backlog`, `Tareas diarias`, `Kanban`, `Ordenar tareas`, `Completar tareas`, `Horario diario` y al detalle de tarea.

### project-ticket-model
- Tipo: `string`. Valor por defecto: vacío.
- Plantilla del ticket, por ejemplo `TEST-XXXX`.
- La primera secuencia de `X` se sustituye por el número actual, rellenado con ceros hasta la longitud de la secuencia (`TEST-XXXX` + `0001` = `TEST-0001`).
- Si el número supera la longitud de la plantilla, se usa el número completo (`TEST-XXXX` + `9999` -> siguiente `TEST-10000`).
- Si la plantilla no contiene ninguna `X`, el número se añade al final.

### project-ticket-order
- Tipo: `string`. Valor por defecto: vacío.
- Guarda el orden actual, por ejemplo `0001`, conservando los ceros a la izquierda.
- Si tiene un valor numérico y `project-ticket-model` está informado, el ticket se autorrellena al abrir el formulario de creación o de clonado de tarea.
- Al crear la tarea, si el ticket enviado coincide con el generado, el valor se incrementa en 1 y se guarda con la misma longitud (`0001` -> `0002`, `0099` -> `0100`).
- Si el usuario modifica el ticket propuesto, el contador no se incrementa.
- Si está en blanco o no es numérico, no hay autorrelleno: el nombre y el número del ticket los escribe el usuario.

### Reglas comunes
- Los tres parámetros admiten valor vacío desde la pantalla de `Configuración`, a diferencia del resto de parámetros de tipo `string`.
- El valor efectivo se resuelve con las mismas reglas de perfil de usuario descritas en este documento, por lo que cada cuenta puede tener su propia configuración.
- Si el incremento de `project-ticket-order` falla, la tarea creada se mantiene y se muestra un error indicando que el contador no se ha actualizado.

## Recuperación de configuración de usuario
Al recuperar la configuración de un usuario, el sistema debe partir de todos los registros de `gestask_configuration`.

Para cada parámetro:
- Si existe `gestask_configuration_profile` para el usuario y `fixed_value` es `false`, se devuelve el valor personalizado.
- Si no existe `gestask_configuration_profile`, se devuelve un objeto equivalente al perfil con `configuration_id` a `null` y `value` igual a `gestask_configuration.default_value`.
- Si `fixed_value` es `true`, se devuelve siempre `gestask_configuration.default_value`, aunque exista un valor personalizado previo del usuario.

El objeto devuelto debe incluir suficiente información del catálogo para que la UI pueda mostrar nombre, tipo, valor efectivo y estado de solo lectura.

Ejemplo conceptual:

```json
{
  "configuration_id": null,
  "user_id": "usuario-actual",
  "value": "valor-por-defecto",
  "name": "Nombre del parametro",
  "parameter_type": "string",
  "fixed_value": false
}
```

## Persistencia de cambios
Solo se insertará un registro en `gestask_configuration_profile` cuando el usuario cambie un valor respecto al valor por defecto.

Reglas:
- Si el usuario mantiene el valor por defecto, no se crea perfil personalizado.
- Si el usuario cambia un valor no fijo, se crea o actualiza `gestask_configuration_profile`.
- Si `fixed_value` es `true`, el valor no se puede modificar desde la UI.
- Si existe un valor personalizado antiguo y después el parámetro pasa a `fixed_value = true`, ese valor se ignora en lectura.

## Pantalla de configuración
La pestaña `Configuración` tendrá dos capacidades principales:
- Modificar valores de configuración propios del usuario.
- Crear nuevos parámetros en `gestask_configuration`.

### Edición de valores
La UI mostrará una tabla o formulario con:
- Nombre del parámetro.
- Tipo del parámetro.
- Valor efectivo.
- Indicador de valor fijo.
- Control de edición adaptado a `parameter_type`.

Los parámetros con `fixed_value = true` deben mostrarse en solo lectura.

### Creación de nuevos parámetros
La UI permitirá crear nuevos registros en `gestask_configuration` con:
- `name`.
- `parameter_type`.
- `default_value`.
- `fixed_value`.

Validaciones mínimas:
- `name` obligatorio.
- `parameter_type` obligatorio y dentro del catálogo permitido.
- `default_value` obligatorio y válido para el tipo elegido.
- `fixed_value` obligatorio, con valor booleano.

## Permisos esperados
- Cada usuario solo puede consultar y modificar sus propios registros de `gestask_configuration_profile`.
- La creación de parámetros en `gestask_configuration` debe considerarse una operación protegida.
- Si más adelante existen roles, la creación de parámetros globales debería restringirse a usuarios autorizados.

## Casos límite
- Parámetro sin perfil de usuario: devolver valor por defecto sin insertar nada.
- Parámetro fijo con perfil existente: devolver valor por defecto e impedir edición.
- Valor incompatible con `parameter_type`: rechazar guardado.
- Cambio de valor personalizado de vuelta al valor por defecto: se puede eliminar el perfil o mantenerlo con el mismo valor, pero la opción preferida es eliminarlo para conservar la regla de no persistir defaults.
- Parámetro `scoring_*` con valor no numérico: rechazar guardado.
