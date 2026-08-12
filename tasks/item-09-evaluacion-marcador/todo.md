# Tasks: Ítem #9 del BACKLOG.md — Cliente PMM: Evaluación inicial y Marcador de incidente

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/item-09-evaluacion-marcador/plan.md`).

- [x] Task: `react-router` + `lib/activacionActual.ts` + `roles.ts` — **hecho 2026-08-11**.
  - Acceptance: `react-router@^8.3.0` instalado; `activacionActual.ts` y `roles.ts` copiados de
    `coe` (solo `ROLES_EDICION_EVALUACION_RELEVO` en `pmm`).
  - Verify: `npm run build --workspace=pmm` sigue limpio.
  - Files: `frontend/apps/pmm/package.json`, `frontend/apps/pmm/src/lib/activacionActual.ts`,
    `frontend/apps/pmm/src/roles.ts`.

- [x] Task: `EvaluacionInicialScreen.tsx` — **hecho 2026-08-11**, 2/2 tests.
  - Acceptance: formulario `magnitud`/`riesgos_secundarios`, resuelve activación en curso, gatea
    por rol (oculta el formulario, muestra aviso, si el rol no está en la lista). `POST
    /evaluaciones-iniciales`.
  - Verify: test RTL con MSW — completar y enviar confirma el `POST` con los campos correctos.
  - Files: `frontend/apps/pmm/src/screens/EvaluacionInicialScreen.tsx`,
    `frontend/apps/pmm/src/screens/EvaluacionInicialScreen.test.tsx`.

- [x] Task: `MarcadorIncidenteScreen.tsx` — **hecho 2026-08-11**, 1/1 test.
  - Acceptance: formulario `coordenada_cuadricula`/`tipo_incidente`/`riesgo`/`capa`, resuelve
    activación en curso. `POST /marcadores-incidente`, badge "sin sincronizar" visible mientras la
    request está en vuelo.
  - Verify: test RTL con MSW (promesa controlada) — badge visible durante el envío, desaparece
    tras la respuesta; `POST` con los campos correctos.
  - Files: `frontend/apps/pmm/src/screens/MarcadorIncidenteScreen.tsx`,
    `frontend/apps/pmm/src/screens/MarcadorIncidenteScreen.test.tsx`.

- [x] Task: `router.tsx` + `App.tsx` — **hecho 2026-08-11**, 3/3 tests de `Shell.test.tsx`.
  - Acceptance: 3 rutas + `Shell` con nav de 3 enlaces (Evaluación inicial oculto sin el rol
    correcto). `App.tsx` renderiza `<RouterProvider>` en la rama "con sesión".
  - Verify: navegación entre las 3 pantallas funciona (test con `createMemoryRouter`); el enlace
    de Evaluación inicial se oculta sin el rol correcto (`getClaims` mockeado).
  - Files: `frontend/apps/pmm/src/router.tsx`, `frontend/apps/pmm/src/shell/Shell.tsx`,
    `frontend/apps/pmm/src/shell/Shell.test.tsx`, `frontend/apps/pmm/src/App.tsx`.
  - **Hallazgo real durante `verify`**: mismo patrón que ítems #4/#5 de `coe` — faltaba el handler
    MSW por defecto de `GET /activaciones` en `apps/pmm/src/mocks/server.ts` (antes vacío, sin
    handlers). Agregado, mismo criterio que `coe`.

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde (`npm run test --workspace=pmm`) — **16/16, 2026-08-11**.
- [x] `npm run lint --workspace=pmm` sin errores — **2026-08-11**.
- [x] `npm run build --workspace=pmm` limpio — **2026-08-11**.
- [x] Verificación manual contra el backend real (Postgres levantado, `alembic upgrade head`) —
      **2026-08-11**. Con una de las activaciones activas creadas en el ítem #8: completada una
      evaluación inicial real (`magnitud: "moderada"`, `riesgos_secundarios: "riesgo de
      reactivacion"`) y un marcador real (`coordenada_cuadricula: "D5"`, capa "incidente") desde
      el formulario, ambos confirmados por `POST` 201 y luego por `GET` directo a la API. El
      extension de Chrome tuvo fallas transitorias de CDP durante la sesión (screenshot y
      `computer:type` dejaron de responder un momento) — se recuperó usando `form_input` (setea el
      valor del campo directo) en vez de simular tipeo, sin afectar el resultado de la
      verificación.
- [x] Correr `verify` (fase final del ciclo, mismo criterio que ítems anteriores) contra `spec.md`
      + `plan.md` + este archivo — **2026-08-11**. Los 4 Success Criteria de `spec.md` se cumplen;
      los 4 checkpoints de `plan.md` confirmados. Único hallazgo real: el handler MSW faltante de
      `/activaciones` (ya corregido y documentado arriba).

**Ítem #9 cerrado — 2026-08-11.**
