# Spec: Cliente COE — Mapa y Unidades (ítem #4 del BACKLOG.md)

Complemento de `FRONTEND-SPEC.md` sección 4 ("Mapa", "Unidades") y `FRONTEND-TASKS.md` Fase 2.
Construye sobre el shell del ítem #2 (`Shell.tsx`, `TabBar.tsx` ya enrutan a `/mapa` y
`/unidades`, hoy *stub*) y reutiliza `usePolling` del ítem #3.

## Decisiones confirmadas

1. **Unidades es editable desde el COE** (confirmado con Renzo, 2026-08-11 — pregunta abierta
   original de `BACKLOG.md`/`FRONTEND-SPEC.md`). `PUT /unidades/{id}` no distingue quién
   actualiza (sin restricción de rol adicional a estar autenticado), sin cambios necesarios en el
   backend.
2. **Mapa es de solo lectura** (`FRONTEND-SPEC.md`, ya cerrado): el COE no crea marcadores, solo
   los lista.
3. **Capa "Unidades" del mapa queda deshabilitada** (fase 2, fuera de alcance v1 — PRD sección 6,
   `FRONTEND-SPEC.md`). Las otras 3 capas (Cuadrícula, Incidente, Accesos) sí se activan/
   desactivan.
4. **Sin proveedor de mapas real**: cuadrícula lógica únicamente (sin coordenadas
   georreferenciables todavía — riesgo técnico abierto en `TECH-DESIGN.md`). No integrar
   Leaflet/OSM ni ninguna librería de mapas esperando coordenadas que no existen.

## Objective

Contenido real de dos pantallas del Cliente COE, reemplazando los stubs del ítem #2:

- **Mapa**: lista de marcadores de incidente (`GET /marcadores-incidente`, filtrado client-side
  por `activacion_id` de la activación en curso — mismo patrón ya usado en `ResumenScreen` del
  ítem #3), con toggle de capas Cuadrícula/Incidente/Accesos (Unidades deshabilitada, visible pero
  no interactiva). Sin proveedor de mapas real: cada marcador se muestra como fila/tarjeta con su
  `coordenada_cuadricula`, `tipo_incidente`, `riesgo` y `capa`.
- **Unidades**: lista de las unidades (`GET /unidades`, sin filtro — no depende de activación),
  con su `estado` (OK/F.S./N.A.) y `hora_recepcion` como "última actualización". El COE puede
  cambiar el `estado` de cada unidad inline (`PUT /unidades/{id}`). Polling 3s en ambas pantallas
  (ADR-5).

Fuente: `FRONTEND-SPEC.md` sección 4 (Mapa, Unidades), líneas 142-156.

**Éxito:** el COE ve los marcadores de la activación en curso agrupados/filtrables por capa, sin
que la pantalla intente dibujar un mapa real; en Unidades ve el estado de cada unidad actualizado
cada 3s y puede cambiarlo, reflejándose el cambio (propio o de otro cliente) en el siguiente ciclo
de polling.

## Tech Stack

- Mismo stack de los ítems #1-#3 (React Router, Radix donde aplique, Tailwind + tokens,
  `usePolling` ya existente).
- Tipos TS nuevos en `packages/api-client/src/types.ts`: `EstadoUnidad` (unión de string, mismo
  patrón que `Instancia`/`CapaMapa`, no un `enum` de TS) y `Unidad`, leídos campo por campo de
  `backend/app/models/unidad.py` y `backend/app/schemas/unidad.py`. `MarcadorIncidente`/`CapaMapa`
  ya existen (agregados en el ítem #3), sin cambios.
- Reutiliza `activacionActual` (`apps/coe/src/lib/activacionActual.ts`, ítem #3) para saber si hay
  activación en curso y su `id`.

## Commands

Mismos del ítem #2/#3, alcance `coe`.

## Project Structure

Nuevo dentro de `frontend/apps/coe/src/`:

```
src/
  screens/
    MapaScreen.tsx        → reemplaza el stub: toggle de capas + lista de marcadores filtrados
    UnidadesScreen.tsx    → reemplaza el stub: lista de unidades + edición inline de estado
```

Actualizado en `packages/api-client/src/types.ts`: `EstadoUnidad`, `Unidad`.

## Code Style

Mismo estilo que `ResumenScreen.tsx`/`CadenaDeMandoScreen.tsx` (ítem #3): componentes función,
`usePolling` para el refresco, `apiClient.apiFetch<T>(path, options?)` directo desde el
componente (no se creó una capa de "servicios" en los ítems anteriores — no introducirla acá sin
un tercer caso de uso que la justifique).

## Testing Strategy

- Vitest + RTL + MSW (mismo patrón que `ResumenScreen.test.tsx`/`CadenaDeMandoScreen.test.tsx`).
- `MapaScreen`: con MSW, mockear `GET /activaciones` (una activa) y `GET /marcadores-incidente`
  (marcadores de la activación en curso + un marcador de otra activación, para confirmar el
  filtro). Confirmar que solo los marcadores de la activación en curso se renderizan, y que
  desactivar una capa oculta sus marcadores.
- `UnidadesScreen`: con MSW, mockear `GET /unidades` y `PUT /unidades/{id}`. Confirmar que cambiar
  el selector de estado de una unidad dispara el `PUT` con el `identificador` y `estado`
  correctos.

## Boundaries

- **Always:** filtrar marcadores client-side por `activacion_id` (el backend no ofrece ese query
  param — mismo boundary que `ResumenScreen`, sección "Always" del spec del ítem #3).
- **Ask first:** agregar un query param de filtro al backend (`GET /marcadores-incidente?
  activacion_id=`, `GET /unidades?estado=`) — el backend está verificado y "congelado" salvo bugs
  reales (mismo boundary de los ítems #1 y #3).
- **Never:** integrar una librería de mapas real (Leaflet/OSM) esperando coordenadas
  georreferenciables que no existen; habilitar la capa "Unidades" del mapa (fase 2, fuera de
  alcance v1); crear marcadores desde el Cliente COE (acción exclusiva del PMM, ítem #9);
  restringir por rol la edición de `PUT /unidades/{id}` (el backend no lo hace, y no hay pedido de
  Renzo para agregarlo).

## Success Criteria

- Con una activación con `estado: "activa"`: Mapa muestra solo los marcadores de esa activación,
  agrupados/filtrables por las 3 capas activas (Cuadrícula, Incidente, Accesos); la capa Unidades
  aparece pero no es interactiva.
- Sin activación activa: Mapa no muestra marcadores (no hay `activacion_id` con el que filtrar) —
  no redirige a otra pantalla (a diferencia de Resumen, Mapa/Unidades son pantallas de
  situación permanente, sin la restricción de "solo con activación en curso").
- Unidades muestra las unidades reales (`GET /unidades`) con su estado y última actualización,
  refrescando solos cada 3s.
- Cambiar el estado de una unidad desde el selector dispara `PUT /unidades/{id}` con el payload
  correcto.
- `npm run test --workspace=coe`, `npm run lint --workspace=coe` y `npm run build --workspace=coe`
  limpios.

## Open Questions

Ninguna bloqueante. La única pregunta abierta de este ítem (edición de unidad desde COE) ya se
confirmó (ver "Decisiones confirmadas" #1). Heredadas de ítems anteriores, sin bloquear este ítem:
mecanismo de sync con token vencido, alcance de Comunicaciones, convocatoria MATPEL.
