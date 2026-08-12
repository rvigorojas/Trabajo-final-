# Tasks: Ítem #7 del BACKLOG.md — Cliente PMM: Setup PWA y login offline

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/item-07-pwa-login-offline/plan.md`).

- [x] Task: tooling de test de `pmm` — **hecho 2026-08-11**.
  - Acceptance: `vitest.config.ts`, `src/test-setup.ts`, `src/mocks/server.ts` (mismo patrón que
    `apps/coe`), script `"test": "vitest run"` en `package.json`.
  - Verify: `npm run test --workspace=pmm` corre sin error de configuración.
  - Files: `frontend/apps/pmm/vitest.config.ts`, `frontend/apps/pmm/src/test-setup.ts`,
    `frontend/apps/pmm/src/mocks/server.ts`, `frontend/apps/pmm/package.json`.

- [x] Task: `vite-plugin-pwa` — **hecho 2026-08-11**.
  - Acceptance: instalado, `VitePWA({ registerType: "prompt", ... })` en `vite.config.ts`.
  - Verify: `npm run build --workspace=pmm` genera los artefactos del service worker.
  - Files: `frontend/apps/pmm/vite.config.ts`, `frontend/apps/pmm/package.json`.
  - **Hallazgo real**: `vite-plugin-pwa` también hay que agregarlo a `vitest.config.ts` (no solo a
    `vite.config.ts`) — sin el plugin ahí, Vite no resuelve el módulo virtual
    `"virtual:pwa-register/react"` y el import falla en el análisis de imports antes de que
    `vi.mock(...)` llegue a interceptarlo. Agregado `VitePWA({ registerType: "prompt" })` también
    en `vitest.config.ts`.

- [x] Task: `ActualizacionDisponible.tsx` — **hecho 2026-08-11**, 2/2 tests.
  - Acceptance: usa `useRegisterSW` de `virtual:pwa-register/react`; con `needRefresh`, aviso +
    botón que llama `updateServiceWorker(true)`.
  - Verify: test con `vi.mock("virtual:pwa-register/react", ...)` — `needRefresh: true` muestra el
    aviso y el click dispara `updateServiceWorker`; `needRefresh: false` no renderiza nada.
  - Files: `frontend/apps/pmm/src/components/ActualizacionDisponible.tsx`,
    `frontend/apps/pmm/src/components/ActualizacionDisponible.test.tsx`.

- [x] Task: `App.tsx` con gateo de sesión — **hecho 2026-08-11**, 2/2 tests.
  - Acceptance: sin `getToken()`, muestra `Login`; con token, placeholder post-login. Ajustado
    durante la implementación: `<ActualizacionDisponible />` se monta **siempre** (no solo
    post-login) — es la que dispara `useRegisterSW`, y el caché del shell debe existir desde antes
    del primer login para que la propia pantalla de Login pueda recargar sin conexión.
  - Verify: test con MSW (sin handlers, `onUnhandledRequest: "error"`) — con token en
    `localStorage`, confirma que se renderiza el placeholder y que ninguna request de red se
    dispara.
  - Files: `frontend/apps/pmm/src/App.tsx`, `frontend/apps/pmm/src/App.test.tsx`.

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde (`npm run test --workspace=pmm`) — **4/4, 2026-08-11**.
- [x] `npm run lint --workspace=pmm` sin errores — **2026-08-11**.
- [x] `npm run build --workspace=pmm` limpio — **2026-08-11** (genera `dist/sw.js`,
      `dist/workbox-*.js`, `dist/manifest.webmanifest`).
- [x] Verificación manual: `vite build --workspace=pmm` + `vite preview --port 4173` —
      **2026-08-11**. Confirmado en `navigator.serviceWorker.getRegistrations()` que el SW quedó
      `"activated"` en `http://localhost:4173/sw.js`. Con un JWT real (`test_duty`) inyectado
      directo en `localStorage["pce.session.token"]`, recargar la página mostró "Sesión iniciada"
      sin pasar por el login — confirmado por `read_network_requests` que ninguna request fue a
      `localhost:8000` (backend), solo assets estáticos.
- [x] Correr `verify` (fase final del ciclo, mismo criterio que ítems anteriores) contra `spec.md`
      + `plan.md` + este archivo — **2026-08-11**. Los 4 Success Criteria de `spec.md` se cumplen;
      los 5 checkpoints de `plan.md` confirmados. Hallazgos reales documentados arriba (VitePWA en
      vitest.config.ts, ActualizacionDisponible siempre montado).

**Ítem #7 cerrado — 2026-08-11.**
