# Plan: Ítem #10 del BACKLOG.md — Cliente PMM: Cola offline y token blando

Insumos: `tasks/item-10-cola-offline-token-blando/spec.md` (validado), `apps/coe/src/shell/
RelevoModal.tsx` (campos a replicar en `RelevoMandoScreen`), `packages/api-client/src/session.ts`
(`saveToken`/`getToken`/`logout` a extender), los 4 routers del backend (ya confirmados
idempotentes por `id` — sin cambios de backend).

## Componentes y dependencias

1. **`fake-indexeddb`** — dependencia de test en `pmm`. Sin dependencias previas.
2. **`packages/api-client/src/session.ts` (modificado)** — agrega `sesionIniciadaEn` (timestamp)
   guardado junto al token en `saveToken()`, leído por `getSesionIniciadaEn()`, limpiado en
   `logout()`. Sin dependencias previas.
3. **`apps/pmm/src/offline/db.ts`** — wrapper de `indexedDB.open` en promesas, 1 object store
   `cola` (keyPath `id`). Depende de (1) para tests.
4. **`apps/pmm/src/offline/ventanaSesion.ts`** — `puedeEncolarNueva()` usando (2). Depende de (2).
5. **`apps/pmm/src/offline/colaOffline.ts`** — `enviarOEncolar(path, body)`, `flushColaOffline()`,
   `tamañoCola()`. Depende de (3), (4), `apiClient`.
6. **`apps/pmm/src/screens/RelevoMandoScreen.tsx`** — nueva, campos de `RelevoModal` de `coe`
   adaptados a pantalla de ruta, gateada por `ROLES_EDICION_EVALUACION_RELEVO` (mismo criterio que
   `EvaluacionInicialScreen`), usa (5) en vez de `apiClient.apiFetch` directo. Depende de (5).
7. **3 pantallas existentes modificadas** (`NuevaActivacionScreen`, `EvaluacionInicialScreen`,
   `MarcadorIncidenteScreen`) — cambian su `POST` directo por (5); las 2 que no generaban `id`
   propio (`EvaluacionInicialScreen`, `MarcadorIncidenteScreen`) suman
   `id: crypto.randomUUID()` al payload. Depende de (5).
8. **`router.tsx` + `Shell.tsx` (modificados)** — ruta `/relevo-mando` + enlace (gateado por rol,
   mismo criterio que Evaluación inicial); contador "N sin sincronizar" leyendo (5)`.tamañoCola()`.
   Depende de (6), (7).
9. **`App.tsx` (modificado)** — listener `window.addEventListener("online", …)` llama a
   `flushColaOffline()`; si el flush corta por 401, limpia sesión (`logout()`) y vuelve a mostrar
   `<Login>`; tras un login exitoso llama `flushColaOffline()` de nuevo. Depende de (5).

## Orden de implementación

{ (1), (2) en paralelo } → (3) → (4) → (5) → { (6), (7) en paralelo } → (8) → (9).

Último ítem antes de este: cierra el backlog salvo el #11 (Endurecimiento), que depende de este.

## Riesgos y mitigación

- **IndexedDB en tests**: `fake-indexeddb/auto` importado en `test-setup.ts` de `pmm` antes de
  cualquier test — sin este import, `indexedDB` no existe en `happy-dom`. Confirmar que no choca
  con el resto del setup existente (MSW, RTL) antes de escribir el primer test de `colaOffline`.
- **Distinguir "falla por red" de "falla por validación"**: `enviarOEncolar` solo encola si
  `fetch` rechaza la promesa (error de red real — `TypeError: Failed to fetch` o similar) o si
  `navigator.onLine === false` antes de intentar. Un `ApiError` con `status` 4xx/5xx (el servidor
  respondió) nunca se encola — se relanza tal cual para que la pantalla lo muestre como error real.
  Este es el punto más fácil de hacer mal (encolar un 422 sería peor que mostrarlo).
- **Orden de la cola**: `flushColaOffline` debe reintentar en el orden en que se encolaron
  (`encoladoEn` ascendente) — importante porque un marcador o evaluación podría depender
  lógicamente de que la activación que lo originó ya exista (aunque el backend no lo valida a
  nivel FK estricta con retraso, mantener el orden evita sorpresas).
- **Corte del flush en 401**: al primer 401, dejar de intentar el resto de la cola (no vaciarla
  parcialmente en cualquier orden) — evita el caso de sincronizar items "fuera de orden" con una
  sesión que ya no es válida para ninguno de ellos.
- **`RelevoMandoScreen` duplica campos de `RelevoModal`**: aceptado en `spec.md` — incluye probar
  que el formulario (sin `Dialog`, como pantalla plana) tiene los mismos 3 campos y el mismo
  `POST`.

## Checkpoints de verificación

- Después de (2): tests de `session.ts` — `saveToken` también guarda `sesionIniciadaEn`; `logout`
  limpia ambos.
- Después de (5): tests de `colaOffline` — éxito no encola; fallo de red encola y no lanza; flush
  reintenta y vacía en éxito; flush se detiene en el primer 401 sin vaciar el resto.
- Después de (6)-(7): tests de las 4 pantallas — mismo comportamiento observable en el caso online
  (el `POST` sigue viendo los campos correctos); `RelevoMandoScreen` oculta el formulario sin el
  rol correcto.
- Después de (8)-(9): test de `App.tsx` — evento `online` con un 401 en la cola limpia sesión y
  vuelve a `Login`; tras login, se llama `flushColaOffline` de nuevo.
- Verificación manual final contra backend real: cortar la red del navegador (dev tools), completar
  las 4 acciones, reconectar, confirmar por `GET` a cada endpoint que llegaron sin duplicados.
  Repetir forzando un JWT vencido (token con `exp` pasado guardado a mano) para confirmar el
  relogin forzado y que la cola sobrevive.
