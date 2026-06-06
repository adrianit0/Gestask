# Especificación UI

## Navegación
Barra superior fija con Backlog, Tareas Diarias, Calendario, Gestor de Tiempos, Gráficas de Rendimiento, Configuración y Logout.

La pestaña Configuración debe representarse con un icono de rueda dentada.

## Backlog
Tabla responsive con colores por estado y borde por estado PR. Crear/editar usa modal compartido.

## Tareas Diarias
Selector de fecha, botón Nuevo día, aviso de modo histórico y listado ordenado por `order_points` descendente.

## Calendario
Grid mensual. Cada día muestra estado, puntos y tickets/tareas finalizadas.

## Configuración
Pantalla protegida para modificar parámetros de usuario y crear nuevos parámetros globales.

La vista debe mostrar:
- Nombre del parámetro.
- Tipo primitivo.
- Valor efectivo.
- Indicador de valor fijo.
- Control de edición adecuado al tipo.

Los parámetros con `fixed_value = true` se muestran en solo lectura y siempre usan el valor por defecto.

La creación de parámetros debe solicitar `name`, `parameter_type`, `default_value` y `fixed_value`.

## Colores
- Principal: `#ff8000`.
- Secundario: `#ffdbb6`.
- Estados según requisitos del backlog y calendario.

## Responsive
En móvil, tablas se desplazan horizontalmente y la navegación permite wrap.
