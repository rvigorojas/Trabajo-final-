# Spec: Cliente COE — Resumen y Cadena de mando (ítem #3 del BACKLOG.md)

Complemento de `FRONTEND-SPEC.md` sección 4 ("Resumen", "Cadena de mando") y `FRONTEND-TASKS.md`
Fase 2. Construye sobre el shell del ítem #2 (`Shell.tsx`, `TabBar.tsx` ya enrutan a
`/resumen` y `/cadena-de-mando`, hoy *stub*).

## Decisiones confirmadas (2026-08-10)

1. **Sin activación en curso, Resumen redirige a Cadena de mando** (decisión explícita del
   usuario, no la opción recomendada por defecto). Efecto colateral aceptado: mientras no haya una
   activación con `estado: "activa"`, la tab "Resumen" es inalcanzable (clickearla vuelve a
   redirigir a Cadena de mando) — es el comportamiento pedido, no un bug.
2. **Cadena de mando sin activación en curso muestra el histórico completo sin filtrar** (`GET
   /relevos-mando` sin `activacion_id`) — consecuencia directa de la decisión 1, ya anticipada al
   preguntarla.
3. **Cómo determinar "la activación en curso"**: `GET /activaciones` no tiene filtro `?estado=`
   (confirmado leyendo `backend/app/routers/activaciones.py`) — se trae la lista completa y se
   filtra client-side por `estado === "activa"`. Asunción (no bloqueante, el modelo de negocio no
   permite dos activaciones simultáneas pero el backend no lo impone): si hubiera más de una, se
   toma la de `hora_evento` más reciente.

## Objective

Contenido real de dos pantallas del Cliente COE, reemplazando los stubs del ítem #2:

- **Resumen**: alerta activa (nivel, tipo de incidente), cronómetro desde `hora_evento`,
  convocatoria COE X/3 · PMM X/3, evaluación inicial (magnitud/riesgos), feed de "últimos
  eventos" armado client-side. Polling 3s (ADR-5).
- **Cadena de mando**: historial de relevos de la activación en curso, doble carril COE/PMM.

Fuente: `FRONTEND-SPEC.md` sección 4 (Resumen, Cadena de mando), líneas 129-140 y 164-168.

**Éxito:** con una activación activa, el COE ve su alerta, cronómetro corriendo, convocatoria en
vivo (actualiza sola cada 3s) y los últimos eventos reales del incidente sin refrescar la página;
"Cadena de mando" muestra los relevos de esa activación en dos columnas.

## Tech Stack

- Mismo stack del ítem #2 (React Router, Radix donde aplique, Tailwind + tokens).
- Hook `usePolling` propio (nuevo, `apps/coe/src/hooks/usePolling.ts`): `setInterval` de 3000ms
  con cleanup en unmount y fetch inicial inmediato (no esperar el primer tick). Se construye acá
  porque ya hay 2 casos de uso documentados (Resumen y, en el ítem #4, Mapa/Unidades) — no es una
  abstracción prematura, es la misma regla de "no compartir sin un segundo caso de uso real" que
  ya se aplicó en el ítem #2, pero acá el segundo caso ya está confirmado por escrito en
  `FRONTEND-SPEC.md`.
- Tipos TS nuevos en `packages/api-client/src/types.ts`: `EvaluacionInicial`, `RelevoMando`
  (+ `Instancia = "coe" | "pmm_ci"`, de `backend/app/models/relevo_mando.py`),
  `MarcadorIncidente` (+ `CapaMapa`, se necesita para el feed de "últimos eventos" aunque la
  pantalla Mapa en sí es el ítem #4) — mismo patrón que los tipos ya existentes, leídos campo por
  campo de los schemas Pydantic reales (`backend/app/schemas/evaluacion_inicial.py`,
  `relevo_mando.py`, `marcador_incidente.py`).

## Commands

Mismos del ítem #2, alcance `coe`.

## Project Structure

Nuevo dentro de `frontend/apps/coe/src/`:

```
src/
  hooks/
    usePolling.ts             → setInterval de 3s con cleanup, fetch inmediato
  screens/
    ResumenScreen.tsx           → reemplaza el stub: alerta, cronómetro, convocatoria,
                                   evaluación inicial, feed de últimos eventos
    CadenaDeMandoScreen.tsx     → reemplaza el stub: doble carril COE/PMM
  lib/
    activacionActual.ts         → GET /activaciones + filtro client-side por estado "activa"
                                   (más reciente por hora_evento si hay más de una)
    ultimosEventos.ts           → combina evaluaciones-iniciales + marcadores-incidente +
                                   relevos-mando + confirmaciones de convocatoria, ordenado por
                                   hora_recepcion desc, top 10 (N=10 — sin número fijado en ningún
                                   documento, ver Open Questions)
```

Actualizado en `packages/api-client/src/types.ts`: `EvaluacionInicial`, `RelevoMando`,
`Instancia`, `MarcadorIncidente`, `CapaMapa`.

## Code Style

Mismo estilo que `TabBar.tsx`/`FloatingActions.tsx` (ítem #2): componentes función, sin
`React.FC`, comentarios solo donde el "por qué" no es obvio (ver ejemplo real ya citado en el
spec del ítem #1).

## Testing Strategy

- Vitest + RTL (ya configurado, `happy-dom`, ver ítem #2).
- `usePolling`: test con `vi.useFakeTimers()` — confirma que llama al callback inmediatamente y
  luego cada 3000ms, y que limpia el interval al desmontar.
- `ResumenScreen`: con MSW, mockear `GET /activaciones` (una activa), `evaluaciones-iniciales`,
  `marcadores-incidente`, `relevos-mando` — confirmar que renderiza nivel de alerta, cronómetro y
  al menos un evento del feed. Caso sin activación activa: confirmar redirect a
  `/cadena-de-mando` (`createMemoryRouter`, mismo patrón que `MenuAparte.test.tsx` del ítem #2).
- `CadenaDeMandoScreen`: con relevos de ambas instancias (`coe`, `pmm_ci`), confirmar que aparecen
  en carriles separados.

## Boundaries

- **Always:** filtrar client-side donde el backend no ofrece filtro (`evaluaciones-iniciales`,
  `marcadores-incidente`, la lista completa de `activaciones`) — no asumir que existe un query
  param que no está en el router real.
- **Ask first:** agregar un endpoint de filtro (`?estado=activa`, `?activacion_id=` en
  `evaluaciones-iniciales`/`marcadores-incidente`) al backend — el backend está verificado y
  "congelado" salvo bugs reales (mismo boundary ya escrito en `tasks/item-01-setup/spec.md`).
- **Never:** construir un endpoint de auditoría para el feed de "últimos eventos" (decisión ya
  tomada en `FRONTEND-SPEC.md` sección 6.2 — combinar endpoints de dominio client-side, no
  depender de `LogAuditoria`); implementar Mapa o Unidades en este ítem (son el ítem #4).

## Success Criteria

- Con una activación con `estado: "activa"`: Resumen muestra nivel de alerta, tipo de incidente,
  cronómetro corriendo desde `hora_evento`, convocatoria "COE X/3 · PMM X/3" con los conteos
  correctos, evaluación inicial si existe, y al menos un evento en el feed de "últimos eventos".
- Los datos de Resumen se refrescan solos cada 3s sin recargar la página (verificable con MSW
  contando llamadas, o manualmente contra el backend real).
- Sin activación activa: navegar a `/resumen` (por click en la tab o URL directa) redirige a
  `/cadena-de-mando`, que muestra el histórico completo de relevos sin filtrar.
- Cadena de mando separa visualmente los relevos de instancia `coe` de los de `pmm_ci`.
- `npm run test --workspace=coe` y `npm run build --workspace=coe` limpios.

## Open Questions

1. Cantidad de eventos a mostrar en el feed de "últimos eventos" (propuesto N=10, sin número
   fijado en ningún documento) — no bloquea, es un valor fácil de ajustar después.
2. Heredadas de ítems anteriores, sin bloquear este ítem: mecanismo de sync con token vencido,
   alcance de Comunicaciones, edición de unidad desde COE, convocatoria MATPEL.
