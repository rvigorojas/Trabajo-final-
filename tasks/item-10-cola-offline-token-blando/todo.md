# Tasks: Ítem #10 del BACKLOG.md — Cliente PMM: Cola offline y token blando

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/item-10-cola-offline-token-blando/plan.md`).

- [x] Task: `fake-indexeddb` + `session.ts` (`sesionIniciadaEn`).
  - Acceptance: `fake-indexeddb` instalado como dependencia de test en `pmm`; `saveToken()` guarda
    también `sesionIniciadaEn` (timestamp); `logout()` limpia ambos; nuevo `getSesionIniciadaEn()`.
  - Verify: tests de `session.ts` — login guarda ambos, logout limpia ambos.
  - Files: `frontend/apps/pmm/package.json`, `frontend/packages/api-client/src/session.ts`,
    `frontend/packages/api-client/src/session.test.ts`.

- [x] Task: `offline/db.ts` + `offline/ventanaSesion.ts`.
  - Acceptance: `db.ts` abre/crea la base IndexedDB con object store `cola` (keyPath `id`).
    `ventanaSesion.ts` expone `puedeEncolarNueva()` (false si pasaron más de 24h desde
    `sesionIniciadaEn`).
  - Verify: `ventanaSesion.test.ts` — reciente → true, +24h → false.
  - Files: `frontend/apps/pmm/src/offline/db.ts`, `frontend/apps/pmm/src/offline/ventanaSesion.ts`,
    `frontend/apps/pmm/src/offline/ventanaSesion.test.ts`, `frontend/apps/pmm/src/test-setup.ts`
    (import `fake-indexeddb/auto`).

- [x] Task: `offline/colaOffline.ts`.
  - Acceptance: `enviarOEncolar(path, body)` intenta POST real; encola en IndexedDB solo si falla
    por red (nunca por 4xx/5xx real); `flushColaOffline()` reintenta en orden, se detiene en el
    primer 401 sin vaciar el resto; `tamañoCola()`.
  - Verify: `colaOffline.test.ts` — éxito no encola; fallo de red encola sin lanzar; flush vacía en
    éxito; flush se detiene en 401.
  - Files: `frontend/apps/pmm/src/offline/colaOffline.ts`,
    `frontend/apps/pmm/src/offline/colaOffline.test.ts`.

- [x] Task: `RelevoMandoScreen.tsx` + 3 pantallas existentes migradas a `enviarOEncolar`.
  - Acceptance: `RelevoMandoScreen` (instancia/responsable saliente/entrante, gateada por
    `ROLES_EDICION_EVALUACION_RELEVO`) usa `enviarOEncolar`. `NuevaActivacionScreen`,
    `EvaluacionInicialScreen`, `MarcadorIncidenteScreen` cambian su `POST` directo por
    `enviarOEncolar`; las 2 últimas suman `id: crypto.randomUUID()` al payload.
  - Verify: tests de las 4 pantallas — mismo comportamiento observable en el caso online;
    `RelevoMandoScreen` oculta el formulario sin el rol correcto.
  - Files: `frontend/apps/pmm/src/screens/RelevoMandoScreen.tsx`,
    `frontend/apps/pmm/src/screens/RelevoMandoScreen.test.tsx`,
    `frontend/apps/pmm/src/screens/NuevaActivacionScreen.tsx`,
    `frontend/apps/pmm/src/screens/EvaluacionInicialScreen.tsx`,
    `frontend/apps/pmm/src/screens/MarcadorIncidenteScreen.tsx` (+ sus tests existentes ajustados).

- [x] Task: `router.tsx` + `Shell.tsx` (ruta y enlace de Relevo, contador "N sin sincronizar").
  - Acceptance: ruta `/relevo-mando` + enlace gateado por rol; `Shell` muestra el tamaño de la cola.
  - Verify: test de `Shell.tsx` — enlace de Relevo oculto sin rol; contador refleja `tamañoCola()`.
  - Files: `frontend/apps/pmm/src/router.tsx`, `frontend/apps/pmm/src/shell/Shell.tsx`,
    `frontend/apps/pmm/src/shell/Shell.test.tsx`.

- [x] Task: `App.tsx` (listener `online` → flush, corte por 401 → relogin).
  - Acceptance: evento `online` dispara `flushColaOffline()`; un 401 en el flush limpia sesión y
    vuelve a `Login`; tras un login exitoso se llama `flushColaOffline()` de nuevo.
  - Verify: `App.test.tsx` — evento `online` con un 401 en la cola limpia sesión y muestra `Login`.
  - Files: `frontend/apps/pmm/src/App.tsx`, `frontend/apps/pmm/src/App.test.tsx`.

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde (`npm run test --workspace=pmm`) — 10 archivos, 29 tests.
- [x] `npm run lint --workspace=pmm` sin errores.
- [x] `npm run build --workspace=pmm` limpio.
- [x] Verificación manual contra el backend real: cortar la red (backend real detenido/reiniciado,
      no simulado), completar las 4 acciones (Nueva activación, Evaluación inicial, Marcador de
      incidente, Relevo de mando), reconectar (evento `online` real vía `window.dispatchEvent`),
      confirmado sin duplicados por `GET` (un solo registro por acción, ids client-generados).
      Repetido con un JWT vencido guardado a mano (firmado con el secreto real del backend): se
      encoló offline igual, al reconectar el backend respondió 401, forzó logout + vuelta a
      `Login`, la cola sobrevivió en IndexedDB, y tras el siguiente login se sincronizó sola sin
      duplicar el registro.
- [x] Correr `verify` (fase final del ciclo) contra `spec.md` + `plan.md` + este archivo — cerrado
      2026-08-13.
