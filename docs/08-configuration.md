# Configuración

## Objetivo
Añadir una nueva pestaña protegida llamada `Configuración`, accesible desde la navegación principal mediante un icono de rueda dentada.

La pestaña permitirá al usuario consultar y modificar sus parámetros de configuración, y también crear nuevos parámetros disponibles para configuración.

Esta documentación define el comportamiento esperado. No implica implementación todavía.

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
