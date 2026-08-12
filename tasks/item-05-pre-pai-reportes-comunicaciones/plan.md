# Plan: Ítem #5 del BACKLOG.md — Cliente COE: Pre-PAI, Reportes y Comunicaciones

Insumos: `tasks/item-05-pre-pai-reportes-comunicaciones/spec.md` (validado), `FRONTEND-SPEC.md`
sección 4, `backend/app/schemas/pre_pai.py` (`PrePAIRead`),
`backend/app/schemas/reporte_cierre.py` (`ReporteCierreRead`), `backend/app/routers/
reportes_cierre.py` (confirma que `POST` es idempotente y no hay `GET` sin id).

## Componentes y dependencias

1. **Tipos TS nuevos en `packages/api-client/src/types.ts`**: `PrePAI` (10 campos de
   `PrePAIRead`) y `ReporteCierre` (`id`, `activacion_id`, `tipo_emergencia`, `generado_en`,
   `datos: Record<string, unknown>`). Sin dependencias previas de este ítem.
2. **`PrePAIScreen.tsx`** — `GET /pre-pai` en un `useEffect` simple (sin `usePolling`, no es dato
   en vivo). Lista de escenarios (nombre + sector); al seleccionar uno (estado local
   `useState<string | null>` con el `id` seleccionado), muestra el detalle completo debajo o al
   costado. Depende de (1).
3. **`ReportesScreen.tsx`** — `GET /activaciones` en `useEffect`, filtro client-side
   `estado === "cerrada"`. Por cada una, botón "Ver reporte" que dispara `POST
   /reportes-cierre` con `{ activacion_id }` y guarda el resultado en un `Map<string,
   ReporteCierre>` local (`activacion_id` → reporte), mostrando sus `datos` como lista
   clave/valor debajo de esa fila. Depende de (1).

## Orden de implementación

(1) → { (2), (3) en paralelo — no comparten estado ni componentes }.

No hay nada después de este ítem dentro de este plan — Relevo/Desactivar reales son el ítem #6.

## Riesgos y mitigación

- **`datos` de `ReporteCierre` es JSON genérico con valores anidados** (`evaluaciones_iniciales`
  y `marcadores_incidente` son arrays de objetos, ver `reportes_cierre.py` líneas 53-66).
  Mitigación: renderizar valores primitivos (string/number) como texto directo, y valores
  objeto/array con `JSON.stringify(valor, null, 2)` dentro de un `<pre>` — no intentar tabular
  columnas específicas (boundary ya escrito en `spec.md`).
- **`POST /reportes-cierre` repetido**: como es idempotente, no hay riesgo de duplicar — pero el
  test debe confirmar que el frontend no bloquea un segundo click (debe simplemente volver a
  mostrar el mismo resultado, no fallar).
- **Selección en `PrePAIScreen` sin Pre-PAI seleccionado**: estado inicial `null`, no mostrar
  ningún detalle hasta que el usuario elija uno — evitar un error de "accediendo a propiedad de
  undefined" si la lista está vacía.

## Checkpoints de verificación

- Después de (1): `tsc --noEmit` en `packages/api-client` sin errores con `PrePAI`/`ReporteCierre`.
- Después de (2): test con MSW — 2 Pre-PAI en la lista, seleccionar uno muestra su detalle
  completo (todos los campos del fixture).
- Después de (3): test con MSW — una activación cerrada y una activa en `GET /activaciones`, solo
  la cerrada aparece en la lista; click en "Ver reporte" dispara el `POST` y muestra los `datos`
  de la respuesta.
- Verificación manual final contra backend real (mismo patrón que ítems #3/#4): Pre-PAI real (si
  hay alguno cargado en la base) o uno creado por API; una activación cerrada real (ya hay una de
  sesiones anteriores) para generar/ver su reporte.
