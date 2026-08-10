# Tasks: Ítem #1 del BACKLOG.md — Setup compartido

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/plan.md`).

- [x] Task: crear el monorepo `frontend/` con npm workspaces — **hecho 2026-08-10**. `npm install`
      limpio, `npm ls --workspaces` confirma `@pce/api-client`, `coe`, `pmm`. Nota: el template
      `react-ts` actual de Vite usa `oxlint` en vez de ESLint para `npm run lint` — se respeta el
      default del scaffold, no se fuerza ESLint.
  - Acceptance: `frontend/package.json` raíz declara `workspaces: ["apps/*", "packages/*"]`;
    existen `frontend/apps/coe`, `frontend/apps/pmm` (cada uno `npm create vite@latest -- --template react-ts`),
    `frontend/packages/api-client` (paquete TS plano, sin framework).
  - Verify: `npm install` desde `frontend/` sin error; `npm ls --workspaces` lista los 3 paquetes.
  - Files: `frontend/package.json`, `frontend/apps/coe/*`, `frontend/apps/pmm/*`, `frontend/packages/api-client/package.json`.

- [x] Task: configurar Tailwind + tokens del design system en ambas apps — **hecho 2026-08-10**,
      verificado por build: `--color-alerta-iii:#d32f2f` presente en el CSS compilado de `coe` y
      `pmm`, clase `.bg-alerta-iii` generada correctamente.
  - **Corrección de spec al implementar:** Tailwind CSS vigente es v4 (confirmado `npm view
    tailwindcss version` → 4.3.3), que usa `@theme` en un archivo CSS + plugin `@tailwindcss/vite`
    en vez de `tailwind.config.ts` (ese formato es v3, legacy). Se ajusta la acceptance:
  - Acceptance: `frontend/packages/api-client/src/design-tokens.css` define, vía `@theme`, los
    colores semánticos (`--color-alerta-i/ii/iii`, `--color-success-safe`,
    `--color-offline-badge`, superficies, `primary`/`secondary`/`tertiary`/`error` con sus
    variantes `on-*`), tipografía (Inter body/headline, JetBrains Mono para
    `data-mono`/`timer-display`), spacing (`--spacing` base 8px, `touch-target-min` 48px) y
    `roundness` — valores tomados literalmente del design system Stitch "Sentinel Command"
    (`assets/16f5e680539043ecade07f8a699daa0b`), no reinventados. `apps/coe` y `apps/pmm` importan
    ese archivo y usan `@tailwindcss/vite` en su `vite.config.ts`.
  - Verify: una página de prueba renderiza un botón con `bg-alerta-iii` y se ve el rojo correcto
    (`#D32F2F`) en el navegador (`npm run dev`).
  - Files: `frontend/packages/api-client/src/design-tokens.css`, `frontend/apps/coe/vite.config.ts`,
    `frontend/apps/coe/src/index.css`, `frontend/apps/pmm/vite.config.ts`, `frontend/apps/pmm/src/index.css`.

- [x] Task: escribir los tipos TS espejo de los schemas Pydantic — **hecho 2026-08-10**,
      `tsc --noEmit` sin errores. Cubre `Usuario`, `Activacion`(+`Create`/`ConCon vocatoria`),
      `ConvocatoriaMiembro` y los 5 enums reales (`Rol`, `InstanciaPrincipal`, `TipoEmergencia`,
      `NivelAlerta`, `EstadoActivacion`), leídos campo por campo de los schemas/modelos reales.
  - Acceptance: `packages/api-client/src/types.ts` define al menos `Usuario`, `Activacion`,
    `ConvocatoriaMiembro` leyendo campo por campo de `backend/app/schemas/usuario.py` y
    `backend/app/schemas/activacion.py` — no inventados. Comentario en el header del archivo
    dejando explícito que es sincronización manual (riesgo de drift ya anotado en `tasks/plan.md`).
  - Verify: `tsc --noEmit` sobre el paquete sin errores.
  - Files: `frontend/packages/api-client/src/types.ts`.

- [x] Task: cliente HTTP tipado — **hecho 2026-08-10**. `ApiError` con `kind` tipado
      (unauthorized/forbidden/validation/unknown), inyección de `getToken` (sin dependencia
      circular con el store de sesión, ver `client.ts`). 3 tests con MSW pasan; confirmado con
      TDD real: rotos a propósito (`errorKindForStatus` devolviendo siempre "unknown") → 2/3
      tests fallaron como se esperaba → revertido → 3/3 pasan de nuevo.
  - Acceptance: función `apiFetch<T>(path, options)` en `packages/api-client/src/client.ts` que
    inyecta `Authorization: Bearer <token>` desde el store de sesión, y mapea 401/403/422 a
    errores tipados distintos (no un solo `Error` genérico) — coincide con
    `FRONTEND-SPEC.md` sección 2 (tabla de endpoints/roles restringidos).
  - Verify: test unitario (Vitest + MSW) que simula un 401 y confirma que se lanza el tipo de
    error correcto, no solo que "falla".
  - Files: `frontend/packages/api-client/src/client.ts`, `frontend/packages/api-client/src/client.test.ts`.

- [x] Task: store de sesión (decodificación de JWT + persistencia) — **hecho 2026-08-10**. 4 tests
      pasan; TDD confirmado (validación de claims rota a propósito → test de rechazo falló →
      revertido → 4/4 pasan).
  - Acceptance: decodifica `sub`, `rol`, `instancia_principal` del JWT (sin librería de
    verificación de firma — el backend ya la validó; el cliente solo lee los claims), persiste en
    localStorage, expone `logout()`.
  - Verify: test unitario con un JWT de fixture (no un token real) que confirma los 3 claims se
    leen correctamente y que `logout()` limpia el storage.
  - Files: `frontend/packages/api-client/src/session.ts`, `frontend/packages/api-client/src/session.test.ts`.

- [x] Task: pantalla de login compartida — **hecho 2026-08-10**. `Login.tsx` en
      `packages/api-client/src/components/`, recibe `apiClient` inyectado (no hardcodea baseUrl,
      reutilizable sin cambios por `coe` y `pmm`). 2 tests (login exitoso guarda token; login
      401 no guarda nada y muestra error) — TDD confirmado (guardado de token roto a propósito →
      test falló con diff claro `null` vs. token esperado → revertido → 2/2 pasan).
  - Acceptance: componente `Login` en `packages/api-client` (o paquete de UI compartido si se
    separa), usado sin cambios por `apps/coe` y `apps/pmm` — formulario usuario/contraseña,
    llama `POST /auth/login`, guarda el token vía el store de sesión (task anterior).
  - Verify: test de integración (React Testing Library) que rellena el formulario, mockea la
    respuesta 200 de `/auth/login`, y confirma que el store de sesión queda poblado.
  - Files: `frontend/packages/api-client/src/components/Login.tsx` (o ruta equivalente si se
    decide un paquete de UI aparte — ajustar entonces `tasks/plan.md`).

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde — 9/9 tests (`vitest run`), `tsc --noEmit` limpio en
      `api-client`, builds limpios de `coe` y `pmm` con tokens del design system confirmados en
      el CSS compilado.
- [x] `npm run lint --workspaces` sin errores — limpio en `coe` (oxlint), `pmm` (oxlint) y
      `@pce/api-client` (`tsc --noEmit`).
- [x] Correr `verify` contra `tasks/spec.md` + este archivo — **hecho 2026-08-10**. 3 hallazgos
      reales, los 3 corregidos y reverificados (no solo anotados):
  - **CRITICAL** — `package.json` de `@pce/api-client` declaraba `main`/`types: src/index.ts`
    pero el archivo no existía; el paquete no era importable por nombre desde `coe`/`pmm`. Los
    tests internos no lo detectaron porque usaban rutas relativas. Fix: creado `src/index.ts`
    como barrel export; verificado con un import real (`App.tsx` de ambas apps ahora usa
    `Login`/`createApiClient`/`getToken` vía `@pce/api-client`, no rutas relativas) + `tsc -b`
    limpio + build exitoso.
  - **CRITICAL** — clase `font-body-lg` (usada en los 3 botones) no existe en Tailwind v4; los
    tokens de texto generan `text-*`, no `font-*`. Confirmado grepeando el CSS compilado (cero
    coincidencias). Fix: `font-body-lg` → `text-body-lg` en los 3 archivos, reverificado en el
    CSS compilado.
  - **CRITICAL** — Tailwind v4 no escanea `node_modules` por default; `Login.tsx` vive ahí (vía
    symlink de workspace) y sus clases nunca se generaban en el build real de `coe`/`pmm` (cero
    clases en el CSS final, aunque el paquete aislado compilaba y testeaba bien). Fix: `@source
    "../../../packages/api-client/src/**/*.{ts,tsx}";` en el `index.css` de ambas apps —
    reverificado: `bg-primary`, `text-body-lg`, `min-h-touch-target-min`, etc. ahora sí aparecen
    en el CSS compilado de ambas apps.
  - Sin hallazgos WARNING/SUGGESTION pendientes tras las correcciones.

## Ítem #1 — CERRADO 2026-08-10

9/9 tests, lint limpio (3 workspaces), builds limpios de `coe` y `pmm` con `Login` real
consumido cross-package (no ruta relativa) y tokens del design system verificados en el CSS
compilado final, no solo en aislamiento. Siguiente: ítem #2 del `BACKLOG.md` (Shell de
navegación Cliente COE, Opción 1A).
