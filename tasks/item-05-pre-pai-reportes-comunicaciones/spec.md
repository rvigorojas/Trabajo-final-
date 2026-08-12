# Spec: Cliente COE — Pre-PAI, Reportes y Comunicaciones (ítem #5 del BACKLOG.md)

Complemento de `FRONTEND-SPEC.md` sección 4 ("Pre-PAI", "Reportes", "Comunicaciones") y
`FRONTEND-TASKS.md` Fase 2. Pre-PAI y Reportes viven en el menú aparte (`MenuAparte`, ítem #2),
no en la barra de tabs principal; Comunicaciones sí es una tab (`ComunicacionesScreen`, hoy stub).

## Decisiones confirmadas (2026-08-11)

1. **Pre-PAI es de solo lectura en este ítem**: listar la biblioteca (`GET /pre-pai`) y ver el
   detalle de cada uno. El botón "Activar" con precarga real hacia el formulario de evaluación
   inicial es el ítem #9 (Cliente PMM) — la única pantalla donde ese formulario existe. No
   construir ningún mecanismo de "activación" en este ítem (ni siquiera un placeholder de botón
   que no haga nada).
2. **Comunicaciones queda como placeholder sin funcionalidad real** — sin entidad de datos
   definida en ningún documento, se define en otro momento. El stub actual (`ComunicacionesScreen`
   del ítem #2) ya cumple esto: **no requiere cambios en este ítem**.
3. **Reportes**: `POST /reportes-cierre` es idempotente (si ya existe un reporte para esa
   `activacion_id`, devuelve el existente sin crear uno nuevo) — no hay `GET /reportes-cierre`
   sin id (solo `GET /reportes-cierre/{id}`), así que el flujo real es "listar activaciones
   cerradas → por cada una, un botón que hace `POST` (crea o recupera) y muestra el resultado",
   no "listar reportes ya generados".

## Objective

- **Pre-PAI**: `GET /pre-pai`, lista con nombre de escenario + sector + tipo de emergencia; al
  seleccionar uno, ver el detalle completo (caracterización, riesgos, contactos, recursos,
  estrategias de control, plano de acceso, dimensiones).
- **Reportes**: listar activaciones con `estado: "cerrada"` (`GET /activaciones`, filtro
  client-side); por cada una, un botón "Ver reporte" que hace `POST /reportes-cierre` con su
  `activacion_id` y muestra el `datos` resultante como tabla genérica clave/valor (valores
  anidados como JSON legible, sin asumir columnas específicas por categoría).
- **Comunicaciones**: sin cambios (ver Decisiones confirmadas #2).

Fuente: `FRONTEND-SPEC.md` sección 4 (Pre-PAI, Reportes, Comunicaciones), líneas 158-182.

**Éxito:** el COE puede consultar la biblioteca completa de Pre-PAI con su detalle, y generar/ver
el reporte de cierre de cualquier activación cerrada sin necesitar saber de antemano el `id` del
reporte.

## Tech Stack

- Mismo stack de los ítems #1-#4.
- Tipos TS nuevos en `packages/api-client/src/types.ts`: `PrePAI` y `ReporteCierre`, leídos campo
  por campo de `backend/app/schemas/pre_pai.py` (`PrePAIRead`) y
  `backend/app/schemas/reporte_cierre.py` (`ReporteCierreRead`).

## Commands

Mismos del ítem #2/#3/#4, alcance `coe`.

## Project Structure

Dentro de `frontend/apps/coe/src/`:

```
src/
  screens/
    PrePAIScreen.tsx     → reemplaza el stub: lista + detalle de Pre-PAI (solo lectura)
    ReportesScreen.tsx   → reemplaza el stub: lista de activaciones cerradas + generar/ver reporte
```

Actualizado en `packages/api-client/src/types.ts`: `PrePAI`, `ReporteCierre`.
`ComunicacionesScreen.tsx` sin cambios.

## Code Style

Mismo estilo que las pantallas de los ítems #3/#4: componente función, `apiClient.apiFetch<T>`
directo, estado local con `useState`. Pre-PAI y Reportes no necesitan `usePolling` (no son datos
"en vivo" de una activación en curso — bibliotecas/reportes que no cambian cada 3s).

## Testing Strategy

- Vitest + RTL + MSW (mismo patrón que ítems anteriores).
- `PrePAIScreen`: con MSW, mockear `GET /pre-pai` con 2 escenarios; confirmar que la lista los
  muestra y que seleccionar uno muestra su detalle completo.
- `ReportesScreen`: con MSW, mockear `GET /activaciones` (una cerrada, una activa) y
  `POST /reportes-cierre`; confirmar que solo la cerrada aparece en la lista, y que clickear "Ver
  reporte" muestra los datos devueltos por el POST.

## Boundaries

- **Always:** filtrar activaciones cerradas client-side (`estado === "cerrada"`) — no existe un
  query param de filtro en `GET /activaciones` (mismo boundary de ítems anteriores).
- **Ask first:** agregar `GET /reportes-cierre` (listar todos) al backend, o cualquier endpoint de
  "vínculo" Pre-PAI↔Activación — el backend está verificado y "congelado" salvo bugs reales.
- **Never:** implementar el botón "Activar" de Pre-PAI con precarga real (es el ítem #9); construir
  un backend o UI funcional para Comunicaciones; asumir columnas específicas del `datos` de
  Reportes (renderizar genérico hasta que el esquema real de cada Excel se confirme).

## Success Criteria

- Pre-PAI: la lista muestra todos los escenarios de `GET /pre-pai`; seleccionar uno muestra su
  detalle completo (todos los campos del schema).
- Reportes: solo las activaciones con `estado: "cerrada"` aparecen en la lista; "Ver reporte"
  genera (o recupera, si ya existía) el reporte vía `POST` y muestra sus `datos`.
- `npm run test --workspace=coe`, `npm run lint --workspace=coe` y `npm run build --workspace=coe`
  limpios.

## Open Questions

Ninguna bloqueante — las dos preguntas abiertas originales de este ítem (alcance de Comunicaciones,
alcance de "activar" un Pre-PAI) ya se confirmaron (ver "Decisiones confirmadas"). Heredadas de
ítems anteriores, sin bloquear este ítem: mecanismo de sync con token vencido, convocatoria MATPEL,
esquema real de columnas de Reportes contra los 4 Excel.
