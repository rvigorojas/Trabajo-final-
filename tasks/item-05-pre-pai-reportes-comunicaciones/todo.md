# Tasks: Ítem #5 del BACKLOG.md — Cliente COE: Pre-PAI, Reportes y Comunicaciones

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/item-05-pre-pai-reportes-comunicaciones/plan.md`).

- [x] Task: tipos TS nuevos (`PrePAI`, `ReporteCierre`) — **hecho 2026-08-11**, `tsc --noEmit` limpio.
  - Acceptance: `packages/api-client/src/types.ts` agrega los 2, leídos campo por campo de
    `backend/app/schemas/pre_pai.py` y `backend/app/schemas/reporte_cierre.py`. Exportados desde
    `packages/api-client/src/index.ts`.
  - Verify: `tsc --noEmit` en `packages/api-client` sin errores.
  - Files: `frontend/packages/api-client/src/types.ts`, `frontend/packages/api-client/src/index.ts`.

- [x] Task: `PrePAIScreen.tsx` — **hecho 2026-08-11**, 1/1 test.
  - Acceptance: reemplaza el stub. `GET /pre-pai` al montar; lista de escenarios
    (nombre_escenario + sector); seleccionar uno muestra su detalle completo (los 10 campos).
  - Verify: test RTL con MSW — 2 Pre-PAI en la lista, seleccionar uno confirma que se renderiza su
    detalle completo.
  - Files: `frontend/apps/coe/src/screens/PrePAIScreen.tsx`,
    `frontend/apps/coe/src/screens/PrePAIScreen.test.tsx`.

- [x] Task: `ReportesScreen.tsx` — **hecho 2026-08-11**, 1/1 test.
  - Acceptance: reemplaza el stub. `GET /activaciones` al montar, filtro client-side
    `estado === "cerrada"`. Por cada una, botón "Ver reporte" que dispara `POST
    /reportes-cierre` y muestra los `datos` de la respuesta (clave/valor, anidados con
    `JSON.stringify`).
  - Verify: test RTL con MSW — una activación cerrada y una activa, solo la cerrada aparece en la
    lista; click en "Ver reporte" muestra los datos del POST.
  - Files: `frontend/apps/coe/src/screens/ReportesScreen.tsx`,
    `frontend/apps/coe/src/screens/ReportesScreen.test.tsx`.
  - **Hallazgo real durante `verify`**: mismo patrón que el ítem #4 — `apps/coe/src/mocks/
    server.ts` no tenía handler por defecto para `GET /pre-pai`, y `MenuAparte.test.tsx` navega a
    `/pre-pai`. Agregado el handler por defecto (`HttpResponse.json([])`).

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde (`npm run test --workspace=coe`) — **23/23, 2026-08-11**.
- [x] `npm run lint --workspace=coe` sin errores — **2026-08-11**.
- [x] `npm run build --workspace=coe` limpio — **2026-08-11**.
- [x] Verificación manual contra el backend real (Postgres levantado, `alembic upgrade head`) —
      **2026-08-11**. Pre-PAI de prueba creado por API ("Prueba Item 5 - Derrame"): la lista lo
      mostró y seleccionar el ítem reveló su detalle completo (caracterización, riesgos). Reportes
      mostró solo la activación cerrada real ("Incendio de prueba E2E"), ocultando la activa; "Ver
      reporte" generó el reporte vía `POST` y mostró sus `datos` completos, incluidos los arrays
      vacíos `evaluaciones_iniciales`/`marcadores_incidente` como `[]`. Nota aparte (no es bug de
      este ítem): el JWT de sesión expiró a los 30 min entre la sesión anterior y esta
      verificación — hubo que loguearse de nuevo; es exactamente el hueco 6.4 ya documentado
      (mecanismo de sync/refresh con token vencido, pendiente de confirmar con Renzo).
- [x] Correr `verify` (fase final del ciclo, mismo criterio que ítems anteriores) contra `spec.md`
      + `plan.md` + este archivo — **2026-08-11**. Los 3 Success Criteria de `spec.md` se cumplen;
      los 4 checkpoints de `plan.md` confirmados. Único hallazgo real: el handler MSW faltante de
      `/pre-pai` (ya corregido y documentado arriba).

**Ítem #5 cerrado — 2026-08-11.**
