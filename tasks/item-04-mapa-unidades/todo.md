# Tasks: Ítem #4 del BACKLOG.md — Cliente COE: Mapa y Unidades

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/item-04-mapa-unidades/plan.md`).

- [x] Task: tipos TS nuevos (`EstadoUnidad`, `Unidad`) — **hecho 2026-08-11**, `tsc --noEmit` limpio.
  - Acceptance: `packages/api-client/src/types.ts` agrega los 2, leídos campo por campo de
    `backend/app/models/unidad.py` y `backend/app/schemas/unidad.py`. Exportados desde
    `packages/api-client/src/index.ts`.
  - Verify: `tsc --noEmit` en `packages/api-client` sin errores.
  - Files: `frontend/packages/api-client/src/types.ts`, `frontend/packages/api-client/src/index.ts`.

- [x] Task: `MapaScreen.tsx` — **hecho 2026-08-11**, 3/3 tests.
  - Acceptance: reemplaza el stub. `usePolling` sobre `GET /activaciones` (vía `activacionActual`)
    + `GET /marcadores-incidente`, filtrado client-side por el `activacion_id` de la activación en
    curso. Toggle de capas Cuadrícula/Incidente/Accesos (estado local); capa "Unidades" visible,
    deshabilitada (`disabled`, no clickeable). Sin activación activa: lista de marcadores vacía,
    sin redirect.
  - Verify: test RTL con MSW — marcadores de 2 activaciones distintas, confirma que solo los de la
    actual se renderizan; desactivar una capa oculta sus marcadores; sin activación activa, lista
    vacía y la pantalla sigue montada (no navega).
  - Files: `frontend/apps/coe/src/screens/MapaScreen.tsx`,
    `frontend/apps/coe/src/screens/MapaScreen.test.tsx`.

- [x] Task: `UnidadesScreen.tsx` — **hecho 2026-08-11**, 1/1 test.
  - Acceptance: reemplaza el stub. `usePolling` sobre `GET /unidades`. Por unidad, `<select>` de
    `estado` (OK/F.S./N.A.); `onChange` dispara `PUT /unidades/{identificador}` con el nuevo
    `estado` y actualiza el estado local con la respuesta.
  - Verify: test RTL con MSW (`userEvent.selectOptions`) — cambiar el `<select>` de una unidad
    confirma el `PUT` con `identificador`/`estado` correctos en el body.
  - Files: `frontend/apps/coe/src/screens/UnidadesScreen.tsx`,
    `frontend/apps/coe/src/screens/UnidadesScreen.test.tsx`.
  - **Hallazgo real durante `verify`**: `apps/coe/src/mocks/server.ts` no tenía un handler por
    defecto para `GET /unidades` (sí para `/activaciones`, `/usuarios`, etc.) — al montar
    `UnidadesScreen` sin querer desde `TabBar.test.tsx` (que navega por todas las tabs), MSW tiraba
    "intercepted a request without a matching request handler" y contaminaba ese test. Agregado el
    handler por defecto (`HttpResponse.json([])`), mismo patrón que los demás endpoints.

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde (`npm run test --workspace=coe`) — **21/21, 2026-08-11**.
- [x] `npm run lint --workspace=coe` sin errores — **2026-08-11**.
- [x] `npm run build --workspace=coe` limpio — **2026-08-11**.
- [x] Verificación manual contra el backend real (Postgres levantado, `alembic upgrade head`) —
      **2026-08-11**. Activación de prueba nueva creada por API ("Prueba Item 4 - Mapa y
      Unidades") con un marcador en la capa "incidente" (`D5 — Incendio focalizado`) y una unidad
      `R1`. En el navegador: Mapa mostró el marcador con las 3 capas activas; desactivar la capa
      "Incidente" lo ocultó correctamente. Unidades mostró `R1 OK`; cambiar el `<select>` a "Fuera
      de servicio" disparó el `PUT` (confirmado por el avance de "Última actualización"), y
      recargar la página mostró el cambio persistido.
- [x] Correr `verify` (fase final del ciclo, mismo criterio que ítems anteriores) contra `spec.md`
      + `plan.md` + este archivo — **2026-08-11**. Los 5 Success Criteria de `spec.md` se cumplen;
      los 4 checkpoints de `plan.md` confirmados. Único hallazgo real: el handler MSW faltante de
      `/unidades` (ya corregido y documentado arriba).

**Ítem #4 cerrado — 2026-08-11.**
