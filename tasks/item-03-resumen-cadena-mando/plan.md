# Plan: Ítem #3 del BACKLOG.md — Cliente COE: Resumen y Cadena de mando

Insumos: `tasks/item-03-resumen-cadena-mando/spec.md` (validado), `FRONTEND-SPEC.md` sección 4,
`backend/app/schemas/{evaluacion_inicial,relevo_mando,marcador_incidente}.py`,
`backend/app/models/{relevo_mando,marcador_incidente}.py` (enums `Instancia`, `CapaMapa`).

## Componentes y dependencias

1. **Tipos TS nuevos en `packages/api-client/src/types.ts`**: `EvaluacionInicial`, `RelevoMando`,
   `Instancia` (`"coe" | "pmm_ci"`), `MarcadorIncidente`, `CapaMapa` (`"cuadricula" | "incidente" |
   "accesos" | "unidades_fase2"`) — leídos campo por campo de los schemas/modelos reales. Sin
   dependencias previas de este ítem — primer componente.
2. **`usePolling` hook** (`apps/coe/src/hooks/usePolling.ts`) — `setInterval` 3000ms, fetch
   inmediato, cleanup en unmount. Sin dependencia de (1), puede ir en paralelo.
3. **`lib/activacionActual.ts`** — `GET /activaciones`, filtra client-side `estado === "activa"`,
   desempata por `hora_evento` más reciente si hay más de una. Depende de (1) (tipo `Activacion`,
   ya existente del ítem #1, sin cambios).
4. **`lib/ultimosEventos.ts`** — combina `evaluaciones-iniciales` + `marcadores-incidente` +
   `relevos-mando` (filtrado server-side por `activacion_id`) + `convocatoria` (ya embebida en
   `ActivacionConConvocatoria`), ordena por `hora_recepcion` desc, top 10. Depende de (1).
5. **`CadenaDeMandoScreen.tsx`** — reemplaza el stub del ítem #2: `GET /relevos-mando` (con
   `?activacion_id=` si hay activación en curso, sin filtro si no), separa en carriles `coe` /
   `pmm_ci`. Depende de (1). Se construye **antes** que (6) porque Resumen redirige acá cuando no
   hay activación — tiene que funcionar primero para que el redirect tenga sentido.
6. **`ResumenScreen.tsx`** — reemplaza el stub del ítem #2: usa (2) para el polling, (3) para
   encontrar la activación, (4) para el feed, redirige a `/cadena-de-mando` (5) si (3) no
   encuentra ninguna. Depende de (1), (2), (3), (4), (5).

## Orden de implementación

(1) → { (2) en paralelo } → (3) → (4) → (5) → (6).

No hay nada después de este ítem dentro de este plan — Mapa/Unidades son el ítem #4.

## Riesgos y mitigación

- **`apps/coe` no tiene MSW instalado** (solo `packages/api-client` lo tiene, del ítem #1). Este
  ítem es el primero que necesita mockear HTTP en `apps/coe`. Mitigación: instalar `msw` como
  devDependency de `coe` antes de escribir los tests de `ResumenScreen`/`CadenaDeMandoScreen`,
  mismo patrón (`setupServer`) que ya usa `packages/api-client/src/client.test.ts`.
- **Cronómetro con timezone**: `hora_evento` viene en ISO 8601 del backend (`datetime` de
  Pydantic, probablemente UTC). Mitigación: calcular el diff siempre en UTC (`Date.parse` ya lo
  hace correctamente si el string trae offset/`Z`) — no asumir hora local del navegador para el
  cálculo, solo para mostrar.
- **`vi.useFakeTimers()` + `fetch` async dentro de `usePolling`**: combinarlos puede colgar el test
  si no se usa `vi.advanceTimersByTimeAsync` (el `await` del fetch nunca resuelve con fake timers
  síncronos). Mitigación: usar `vi.advanceTimersByTimeAsync` en el test de `usePolling`, no
  `advanceTimersByTime`.
- **Más de una activación con `estado: "activa"` simultánea**: no debería pasar por el modelo de
  negocio, pero el backend no lo impide técnicamente. Mitigación ya decidida en el spec: tomar la
  de `hora_evento` más reciente — documentado como asunción, no bloqueante.

## Checkpoints de verificación

- Después de (1): `tsc --noEmit` en `packages/api-client` sin errores con los 5 tipos/enums
  nuevos.
- Después de (2): test de `usePolling` con fake timers — llama inmediato + cada 3000ms + limpia al
  desmontar.
- Después de (3)+(4): funciones puras, testeables sin red real (arrays de fixtures in-memory, sin
  necesidad de MSW todavía).
- Después de (5): `CadenaDeMandoScreen` renderiza relevos de fixture en 2 carriles separados.
- Después de (6): con MSW, `ResumenScreen` con una activación activa muestra alerta + cronómetro +
  convocatoria + feed; sin activación activa, redirige a `/cadena-de-mando` (test con
  `createMemoryRouter`, mismo patrón que `MenuAparte.test.tsx` del ítem #2).
