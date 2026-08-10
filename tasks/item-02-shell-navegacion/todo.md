# Tasks: Ítem #2 del BACKLOG.md — Shell de navegación Cliente COE (Opción 1A)

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/item-02-shell-navegacion/plan.md`).

- [x] Task: instalar React Router y montar `RouterProvider` en `App.tsx` — **hecho 2026-08-10**.
      `react-router` 8.3.0. Deep-link a `/mapa` y redirect de `/` a `/resumen` verificados en
      navegador real, sin errores de consola. `npm run build --workspace=coe` limpio.
  - Acceptance: `react-router` (v8.3.0, confirmada `npm view react-router version` — no
    `react-router-dom` legacy) agregado a `apps/coe/package.json`. `router.tsx` define un
    `createBrowserRouter` con rutas para `/resumen`, `/mapa`, `/unidades`, `/comunicaciones`,
    `/cadena-de-mando`, `/pre-pai`, `/reportes`, todas anidadas bajo `Shell` como layout route.
    `App.tsx` sigue mostrando `<Login>` si no hay token (comportamiento actual sin cambios);
    con token, monta `<RouterProvider router={router} />`.
  - Verify: `npm run dev --workspace=coe`, con un token de sesión simulado en localStorage,
    navegar a `/resumen` renderiza sin error de consola. `npm run build --workspace=coe` limpio.
  - Files: `frontend/apps/coe/src/router.tsx`, `frontend/apps/coe/src/App.tsx`,
    `frontend/apps/coe/package.json`.

- [x] Task: pantallas stub (7) — **hecho 2026-08-10**, las 7 en `src/screens/`, ruteadas.
  - Acceptance: `ResumenScreen.tsx`, `MapaScreen.tsx`, `UnidadesScreen.tsx`,
    `ComunicacionesScreen.tsx`, `CadenaDeMandoScreen.tsx`, `PrePAIScreen.tsx`,
    `ReportesScreen.tsx` en `frontend/apps/coe/src/screens/`, cada uno solo un `<h1>` con el
    nombre de la pantalla — sin lógica, sin fetch, sin nada que se filtre al alcance de los
    ítems #3-#6. Referenciados desde `router.tsx`.
  - Verify: cada ruta de la task anterior renderiza el `<h1>` correspondiente (visual, vía
    `npm run dev`, o test de `router.tsx` que ya cubre esto).
  - Files: `frontend/apps/coe/src/screens/*.tsx`.

- [x] Task: `TabBar.tsx` con Radix `Tabs` + `Shell.tsx` — **hecho 2026-08-10**. 3/3 tests
      (`createMemoryRouter` + RTL), click real verificado en navegador.
  - **Bug real encontrado y corregido (no de código propio, de entorno de test):**
    `RouterProvider` con `createMemoryRouter` + `jsdom` tira `TypeError: RequestInit: Expected
    signal ("AbortSignal {}") to be an instance of AbortSignal` en cualquier navegación — el data
    router de React Router 8 arma un `Request` interno en cada `navigate()`, y jsdom instala su
    propia clase `AbortSignal` (para el "abortable fetch" del spec DOM) que no es `instanceof` la
    que espera `undici`. Conflicto de identidad de clase entre jsdom y el data router de React
    Router v6.4+/v7/v8, no un bug de esta app. Fix: `happy-dom` en vez de `jsdom` como entorno de
    test de `coe` (`vitest.config.ts`, comentario inline) — no tiene ese conflicto. `jsdom`
    desinstalado del workspace; `packages/api-client` sigue con `jsdom` sin problema porque sus
    tests no navegan con `RouterProvider`.
  - Acceptance: `Shell.tsx` renderiza `<Outlet/>` + `TabBar`. `TabBar` usa
    `Tabs.Root`/`Tabs.List`/`Tabs.Trigger` de Radix para las 5 pantallas principales (Resumen,
    Mapa, Unidades, Comunicaciones, Cadena de mando), sincronizado con la ruta activa de React
    Router (cada `Tabs.Trigger` navega con `useNavigate`, el valor activo se deriva de
    `useLocation`). `TabBar` tiene `overflow-x-auto` para la compresión en portrait (verificación
    manual, no test — ver `plan.md`).
  - Verify: test de RTL con `createMemoryRouter` (fixture con las 7 rutas apuntando a los stubs):
    click en cada una de las 5 tabs cambia la URL activa (`router.state.location.pathname`) y el
    `<h1>` mostrado.
  - Files: `frontend/apps/coe/src/shell/Shell.tsx`, `frontend/apps/coe/src/shell/TabBar.tsx`,
    `frontend/apps/coe/src/shell/TabBar.test.tsx`.

- [x] Task: `FloatingActions.tsx` gateado por rol — **hecho 2026-08-10**. Roles copiados literal
      de `backend/app/deps.py`. 3/3 tests, TDD confirmado (gating roto a propósito → 2/3 fallaron
      con el diff esperado → revertido → 3/3 pasan de nuevo). Verificado en navegador con JWT de
      fixture (`rol: duty_manager`): ambos botones visibles.
  - Acceptance: `frontend/apps/coe/src/shell/roles.ts` copia literal
    `ROLES_EDICION_EVALUACION_RELEVO` y `ROLES_DESACTIVACION` de `backend/app/deps.py` (mismos 6
    y 3 roles respectivamente), con comentario apuntando al archivo fuente. `FloatingActions.tsx`
    lee `getClaims()?.rol` de `@pce/api-client` y muestra el botón "Relevo de mando" solo si el
    rol está en `ROLES_EDICION_EVALUACION_RELEVO`, y "Desactivar" solo si está en
    `ROLES_DESACTIVACION` — oculto por completo si no (no deshabilitado, según spec). Ambos
    botones se renderizan dentro de `Shell.tsx`, siempre visibles sobre cualquier pantalla.
  - Verify: test de RTL con `getClaims` mockeado — rol `duty_manager` (está en ambas listas)
    muestra los 2 botones; rol `bombero_aeronautico` (fuera de ambas) no muestra ninguno.
  - Files: `frontend/apps/coe/src/shell/roles.ts`, `frontend/apps/coe/src/shell/FloatingActions.tsx`,
    `frontend/apps/coe/src/shell/FloatingActions.test.tsx`.

- [x] Task: `MenuAparte.tsx` para Pre-PAI/Reportes — **hecho 2026-08-10**. 1/1 test, click real en
      navegador confirmado.
  - **Hallazgo colateral (no del código, del entorno del navegador de prueba):** con `duty_manager`
    logueado se vio "Informes" en vez de "Reportes" en el menú — el DOM real ya decía "Reportes"
    (confirmado leyendo `textContent`), pero Chrome traducía la página automáticamente porque
    `apps/coe/index.html` (y `apps/pmm/index.html`, mismo problema) declaraban `lang="en"` con
    contenido 100% en español. Corregido `lang="es"` en ambos `index.html` — verificado que ya no
    dispara la traducción automática.
  - Acceptance: menú (ícono + `DropdownMenu` de Radix) en el header de `Shell.tsx`, fuera de la
    barra de tabs principal, con links a `/pre-pai` y `/reportes` — coincide con `Design.md`
    Flujo B, Hueco 2 ("menú aparte del header, fuera de la barra de tabs principal").
  - Verify: test de RTL — abrir el menú y hacer click en "Pre-PAI" navega a `/pre-pai` sin que
    esa ruta haya aparecido nunca en `TabBar`.
  - Files: `frontend/apps/coe/src/shell/MenuAparte.tsx`,
    `frontend/apps/coe/src/shell/MenuAparte.test.tsx`.

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde — 7/7 tests (`vitest run`).
- [x] `npm run lint --workspace=coe` sin errores (oxlint).
- [x] `npm run build --workspace=coe` limpio (159 módulos, sin warnings).
- [x] Verificación manual en navegador real (no devtools emulation — `resize_window` a 375×700,
      viewport real resultante 508px de ancho): `TabBar` overflowea (`scrollWidth` 658 >
      `clientWidth` 508), `overflow-x: auto` activo, las 5 tabs siguen presentes en el DOM (ninguna
      recortada), scrollbar horizontal visible y funcional. Conteo de clics: con el shell 1A cada
      una de las 5 tabs y las 2 rutas del menú aparte son 1 clic desde cualquier pantalla — muy
      por debajo del máximo de 3 (PRD sección 7).
- [x] Pase de revisión final contra `spec.md` + `plan.md` + este archivo — 2 hallazgos reales,
      ambos corregidos y reverificados (no solo anotados), ver arriba en las tasks de TabBar y
      MenuAparte: el conflicto jsdom/data-router (entorno de test) y `lang="en"` en ambos
      `index.html` (traducción automática no deseada). Sin hallazgos pendientes.

## Ítem #2 — CERRADO 2026-08-10

7/7 tests, lint y build limpios, shell de navegación completo (5 tabs + 2 acciones flotantes
gateadas por rol + menú aparte) verificado con clics reales en navegador, no solo en tests.
Siguiente: ítem #3 del `BACKLOG.md` (Cliente COE — Resumen y Cadena de mando).
