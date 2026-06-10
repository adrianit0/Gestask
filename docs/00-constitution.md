# Gestask - Constitución

## Producto
Gestask es una plataforma web personal de productividad laboral para gestionar backlog, tareas diarias, partes de trabajo, calendario laboral y rendimiento.

## Principios técnicos
- SPA JavaScript sencilla y mantenible.
- Supabase como backend principal: Auth, PostgreSQL y Edge Functions.
- Separación clara entre UI, servicios HTTP, configuración y utilidades.
- Cada cambio de base de datos se versiona en `supabase/sql/script-NNN.sql`.
- Las Edge Functions exponen contratos pequeños, validados y orientados a usuario autenticado.

## Principios UI/UX
- Interfaz limpia, responsive y funcional.
- Navegación superior fija.
- Color principal `#ff8000` y secundario `#ffdbb6`.
- Estados de carga, vacío, éxito y error visibles.
- Las secciones no implementadas deben mostrar placeholders claros.

## Seguridad
- No exponer claves privadas en frontend.
- Usar variables de entorno para URL y publishable key.
- Validar usuario autenticado en Edge Functions.
- Activar RLS en tablas de usuario.
- Toda consulta debe estar acotada por `auth.uid()` o por el usuario autenticado.

## Datos
- `profiles` representa al usuario de aplicación.
- `tasks` es la fuente de verdad del backlog.
- `daily_reports` y `daily_report_tasks` representan partes diarios.
- `calendar_day_statuses` almacena excepciones del calendario.
- Los fines de semana se calculan, no se persisten.

## Evolución
- Cada iteración debe actualizar documentación, SQL, funciones y frontend cuando aplique.
- Las decisiones técnicas se registran en `docs/10-decisions.md`.
- No se rompen contratos públicos sin documentar migración.

## Convenciones
- Tablas en `snake_case` plural.
- Edge Functions en `kebab-case`.
- Componentes frontend en `PascalCase.js`.
- Servicios frontend en `camelCaseService.js`.
- Scripts SQL incrementales: `script-001.sql`, `script-002.sql`.

## Calidad
- Proyecto compilable.
- Imports válidos.
- Errores JSON consistentes.
- SQL idempotente cuando sea razonable.
- UI usable en móvil.
