# Tasks: Ítem #3 del BACKLOG.md — Cliente COE: Resumen y Cadena de mando

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/item-03-resumen-cadena-mando/plan.md`).

- [x] Task: tipos TS nuevos (`EvaluacionInicial`, `RelevoMando`, `Instancia`, `MarcadorIncidente`,
      `CapaMapa`) — **hecho 2026-08-10**, `tsc --noEmit` limpio.
  - Acceptance: `packages/api-client/src/types.ts` agrega los 5, leídos campo por campo de
    `backend/app/schemas/evaluacion_inicial.py`, `relevo_mando.py`, `marcador_incidente.py` y
    `backend/app/models/relevo_mando.py`/`marcador_incidente.py` (los 2 enums). Exportados desde
    `packages/api-client/src/index.ts`.
  - Verify: `tsc --noEmit` en `packages/api-client` sin errores.
  - Files: `frontend/packages/api-client/src/types.ts`, `frontend/packages/api-client/src/index.ts`.

- [x] Task: `usePolling` hook + MSW en `apps/coe` — **hecho 2026-08-10**, 2/2 tests con fake
      timers.
  - Acceptance: `usePolling(callback, intervalMs=3000)` — llama `callback` inmediatamente al
    montar y luego cada `intervalMs`, limpia el `setInterval` al desmontar. `msw` agregado como
    devDependency de `coe`.
  - Verify: test con `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync` — confirma la llamada
    inmediata, una llamada adicional tras avanzar 3000ms, y que no llama más tras `unmount()`.
  - Files: `frontend/apps/coe/src/hooks/usePolling.ts`,
    `frontend/apps/coe/src/hooks/usePolling.test.ts`, `frontend/apps/coe/package.json`.

- [x] Task: `lib/activacionActual.ts` — **hecho 2026-08-10**, 3/3 tests.
  - Acceptance: función que recibe la lista de `GET /activaciones` (ya resuelta) y devuelve la de
    `estado === "activa"` más reciente por `hora_evento`, o `null` si no hay ninguna.
  - Verify: test unitario con fixtures in-memory — 0 activas → `null`; 1 activa → esa; 2 activas →
    la de `hora_evento` más reciente.
  - Files: `frontend/apps/coe/src/lib/activacionActual.ts`,
    `frontend/apps/coe/src/lib/activacionActual.test.ts`.

- [x] Task: `lib/ultimosEventos.ts` — **hecho 2026-08-10**, 2/2 tests.
  - Acceptance: función que combina evaluaciones iniciales + marcadores de incidente + relevos de
    mando + confirmaciones de convocatoria (ya filtrados por `activacion_id` por quien la llama),
    los normaliza a un tipo común de "evento" (`{ tipo, descripcion, hora_recepcion }`), ordena por
    `hora_recepcion` desc y devuelve los primeros 10.
  - Verify: test unitario con fixtures de las 4 fuentes mezcladas fuera de orden — confirma orden
    final correcto y el corte en 10.
  - Files: `frontend/apps/coe/src/lib/ultimosEventos.ts`,
    `frontend/apps/coe/src/lib/ultimosEventos.test.ts`.

- [x] Task: `CadenaDeMandoScreen.tsx` — **hecho 2026-08-10**, 1/1 test con MSW.
  - Acceptance: reemplaza el stub. Si hay activación en curso (`activacionActual`), pide `GET
    /relevos-mando?activacion_id=<id>`; si no, pide sin filtro (histórico completo). Separa los
    resultados en 2 carriles por `instancia` (`coe` / `pmm_ci`).
  - Verify: test RTL con MSW — fixture de relevos de ambas instancias, confirma que aparecen en
    contenedores/columnas separados.
  - Files: `frontend/apps/coe/src/screens/CadenaDeMandoScreen.tsx`,
    `frontend/apps/coe/src/screens/CadenaDeMandoScreen.test.tsx`.

- [x] Task: `ResumenScreen.tsx` — **hecho 2026-08-10**, 2/2 tests con MSW (con activación activa,
      y redirect a Cadena de mando sin ninguna). TDD confirmado en el redirect (roto a propósito
      → falló → revertido → pasa).
  - **Bug real encontrado y corregido al verificar contra el backend real en navegador (no solo
    tests, que usan MSW y no lo exponen):** el backend no tenía CORS configurado —
    `fetch()` desde `apps/coe` (Vite, `localhost:5183`) fallaba con `TypeError: Failed to fetch`
    aunque el backend respondía bien por `curl`. Agregado `CORSMiddleware` en
    `backend/app/main.py` con `cors_origin_regex` (`app/core/config.py`) permitiendo cualquier
    puerto de `localhost`/`127.0.0.1` — los dev servers de Vite no tienen puerto fijo.
    **Pendiente al retomar la sesión:** el backend corriendo en background todavía tiene el
    código viejo (sin CORS) cargado — hace falta reiniciarlo (`uvicorn app.main:app --port 8000`
    desde `backend/`, con `.venv` activo) para que tome el cambio, y recién ahí reverificar en
    navegador contra la activación de prueba ya creada en Postgres (usuario `test_duty` /
    `test1234`, activación real con `tipo_incidente: "Incendio de prueba E2E"`, ambas creadas en
    esta sesión, siguen en la base).
  - Acceptance: reemplaza el stub. Usa `activacionActual` sobre `GET /activaciones` (vía
    `usePolling`); si es `null`, `navigate("/cadena-de-mando", { replace: true })`. Si existe:
    muestra nivel de alerta + tipo de incidente + cronómetro desde `hora_evento` + convocatoria
    "COE X/3 · PMM X/3" (contando `convocatoria` embebida por `instancia_principal` del usuario
    convocado y `hora_confirmacion` no nulo) + evaluación inicial si existe + feed de
    `ultimosEventos`.
  - Verify: test RTL con MSW — con una activación activa, confirma alerta/cronómetro/convocatoria/
    feed renderizados; sin ninguna activa, confirma el redirect a `/cadena-de-mando`
    (`createMemoryRouter`, mismo patrón que `MenuAparte.test.tsx`).
  - Files: `frontend/apps/coe/src/screens/ResumenScreen.tsx`,
    `frontend/apps/coe/src/screens/ResumenScreen.test.tsx`.

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde (`npm run test --workspace=coe`) — **17/17, 2026-08-11**.
- [x] `npm run lint --workspace=coe` sin errores — **2026-08-11**.
- [x] `npm run build --workspace=coe` limpio — **2026-08-11**.
- [x] Verificación manual contra el backend real (Postgres levantado, `alembic upgrade head`) —
      **2026-08-11**. Backend reiniciado con el `CORSMiddleware` de la sesión anterior (ya no
      fallaba `fetch()` desde `localhost:5173`). Contra la activación real ya presente en Postgres
      (`test_duty`/`test1234`, "Incendio de prueba E2E"): Resumen mostró alerta II, cronómetro
      corriendo (confirmado avance entre dos screenshots), convocatoria "COE 0/3 · PMM 0/3", feed
      vacío (correcto: sin evaluación inicial/marcadores/relevos/confirmaciones reales para esa
      activación). Polling cada 3s confirmado por red (`read_network_requests`: 3 ciclos de los 5
      endpoints). Los botones "Relevo de mando"/"Desactivar" del shell no tienen handler todavía
      (son el ítem #6, fuera de alcance) — la desactivación para probar el redirect se hizo vía
      `POST /activaciones/{id}/desactivar` directo por API, no por UI. Con la activación cerrada,
      `/resumen` redirigió a `/cadena-de-mando` mostrando los 2 carriles COE/PMM.
- [x] Correr `verify` (fase final del ciclo SDD) contra `spec.md` + `plan.md` + este archivo —
      **2026-08-11**. Los 5 Success Criteria de `spec.md` se cumplen; los 5 checkpoints de
      `plan.md` quedaron confirmados durante el desarrollo (sesión anterior) y esta verificación
      final confirma el comportamiento end-to-end contra backend real. Sin hallazgos nuevos.

**Ítem #3 cerrado — 2026-08-11.**
