# Spec: Cliente PMM — Cola offline y token blando (ítem #10 del BACKLOG.md)

Ítem más complejo del backlog (`BACKLOG.md`). Complemento de `FRONTEND-SPEC.md` sección 5
("Mecanismo de cola offline") y ADR-6/ADR-7. Las dos preguntas que bloqueaban este ítem —ventana
del token blando y reconciliación con JWT vencido (hueco 6.4)— ya se confirmaron con Renzo
(2026-08-12, ver `TECH-DESIGN.md`/`FRONTEND-SPEC.md`/ADR-7 actualizados): **24h** de ventana, y
re-login forzado con la cola intacta al reconectar con token vencido, sin cambios en el backend.

## Decisiones (asunciones a confirmar en el gate)

1. **Alcance de "las 4 escrituras offline-capaces" (ADR-6): activación, evaluación inicial,
   marcador de incidente y relevo de mando.** Las primeras 3 ya tienen pantalla en `pmm` (ítems
   #8/#9). **Relevo de mando no tiene ninguna pantalla en `pmm` todavía** — el ítem #9 lo excluyó
   explícitamente de su alcance, y el `RelevoModal` del ítem #6 vive solo en `apps/coe/src/shell/`
   (no compartido). Sin una pantalla de Relevo en `pmm`, la cola offline quedaría incompleta
   respecto de lo que exige ADR-6. **Este ítem agrega una pantalla `RelevoMandoScreen` a `pmm`**
   (mismos campos que `RelevoModal` de `coe` — instancia/responsable saliente/entrante—, como
   pantalla de ruta, no modal, duplicada en vez de compartida entre apps, mismo criterio ya
   aplicado con `apiClient.ts`/`activacionActual.ts` en los ítems #8/#9), gateada por
   `ROLES_EDICION_EVALUACION_RELEVO` igual que `EvaluacionInicialScreen`.
2. **Implementación de la cola: IndexedDB directa (sin librería nueva).** `idb-keyval` simplificaría
   el código, pero agrega una dependencia nueva solo para ~3 operaciones (`get`/`put`/`delete` sobre
   un único object store) que son igual de simples escritas a mano contra la API nativa — y evita
   sumar `fake-indexeddb` como dependencia de test si `idb-keyval` no la necesitara igual (si la
   necesita de todos modos, se reconsidera). Un módulo `apps/pmm/src/offline/db.ts` envuelve
   `indexedDB.open` en promesas.
3. **Wrapper único, no 4 implementaciones**: `apps/pmm/src/offline/colaOffline.ts` expone
   `enviarOEncolar(path, body)` — intenta el `POST` real primero; si falla por red (offline real o
   `fetch` rechaza por `TypeError`, nunca por un 4xx/5xx del servidor, que sí es un error real a
   mostrar) lo guarda en IndexedDB con `{ id, path, body, encoladoEn }` y no lanza. Las 4 pantallas
   (`NuevaActivacionScreen`, `EvaluacionInicialScreen`, `MarcadorIncidenteScreen`,
   `RelevoMandoScreen`) cambian su `apiClient.apiFetch(..., { method: "POST" })` directo por este
   wrapper — mismo `id`/`activacion_id` generado client-side que ya usan (ítem #8, `crypto.randomUUID()`
   solo lo genera activación; los otros 3 no tienen id propio hoy y lo necesitan para ser
   idempotentes en un reintento — se agrega `id: crypto.randomUUID()` al payload de los 3, el
   backend ya acepta `id` opcional client-generado en todos los inserts offline-capaces, ADR-6).
4. **Flush automático al reconectar**: `window.addEventListener("online", …)` dispara
   `flushColaOffline()`, que reintenta cada item encolado en orden de `encoladoEn` contra el mismo
   `path`. Si un item falla por 401 (token vencido — hueco 6.4), el flush se detiene ahí (no sigue
   probando los siguientes), limpia la sesión (`logout()` de `@pce/api-client`) y deja el resto de
   la cola intacta — el gateo de `App.tsx` vuelve a mostrar `<Login>`; tras un login exitoso, se
   vuelve a llamar `flushColaOffline()`. Un item que falla por un 4xx/5xx que no sea 401 (ej. 422)
   se remueve de la cola y se reporta como error irrecuperable (no tiene sentido reintentar un dato
   inválido para siempre) — caso borde de baja probabilidad dado que el formulario ya valida antes
   de encolar, documentado, no bloqueante.
5. **Ventana de 24h se mide desde el login, no desde que empezó el offline**: `saveToken()` (login)
   ya existe en `@pce/api-client`; se agrega `sesionIniciadaEn` (timestamp) al mismo storage. Antes
   de encolar una acción *nueva*, `colaOffline.ts` chequea `Date.now() - sesionIniciadaEn > 24h` —
   si se superó, la pantalla muestra "sesión offline vencida, reconectate para continuar" en vez de
   encolar (los items ya encolados no se tocan). Se limpia `sesionIniciadaEn` en cada login nuevo.
6. **Indicador visible de la cola**: se agrega un contador simple ("N sin sincronizar") en el
   `Shell` de `pmm` (nav de 3→4 enlaces tras sumar Relevo), leyendo el tamaño de la cola on-mount y
   tras cada `online`/flush — no hace falta polling continuo, la cola solo cambia por acciones del
   propio usuario o por reconexión, ambos eventos ya observables. El badge "sin sincronizar" del
   ítem #9 en `MarcadorIncidenteScreen` (estado del envío en curso) se mantiene igual — sigue
   siendo válido para el caso online-con-latencia; el contador global del Shell es el que refleja
   la cola persistente real.

## Objective

- Las 4 escrituras offline-capaces (activación, evaluación inicial, marcador de incidente, relevo
  de mando) funcionan sin conexión: se guardan en IndexedDB y se reintentan solas al reconectar,
  sin duplicarse (mismo `id` en cada reintento, backend idempotente).
- Token blando: el dispositivo sigue aceptando y encolando acciones con JWT ya vencido mientras
  esté offline, hasta la ventana de 24h desde el login.
- Al reconectar con JWT vencido: relogin forzado, cola intacta, sync automático post-login.
- Nueva pantalla `RelevoMandoScreen` en `pmm` (única forma de que Relevo de mando sea una de las 4
  escrituras offline-capaces reales, no solo de nombre en ADR-6).

Fuente: `BACKLOG.md` ítem #10, `FRONTEND-SPEC.md` sección 5 ("Mecanismo de cola offline"), ADR-6,
ADR-7 (con la nota de resolución del hueco 6.4).

**Éxito:** con el dispositivo sin conexión (simulado apagando la red del navegador/dev tools),
completar cualquiera de las 4 acciones las guarda localmente sin error visible al usuario más allá
de un indicador de "sin sincronizar"; al reconectar, se sincronizan solas contra el backend real
sin duplicados; si el token ya venció al reconectar, la app pide login antes de sincronizar y no
pierde la cola.

## Tech Stack

- Sin librerías nuevas — IndexedDB nativa vía un wrapper propio en `apps/pmm/src/offline/db.ts`.
- `fake-indexeddb` como dependencia de test (`apps/pmm`) — jsdom/happy-dom no implementan
  IndexedDB real.

## Commands

`npm install -D fake-indexeddb --workspace=pmm`. Resto igual que ítems anteriores.

## Project Structure

```
apps/pmm/src/
  offline/
    db.ts                 → wrapper de indexedDB.open en promesas (1 object store: "cola")
    colaOffline.ts         → enviarOEncolar(path, body), flushColaOffline(), tamañoCola()
    ventanaSesion.ts        → sesionIniciadaEn (localStorage), puedeEncolarNueva()
  screens/
    RelevoMandoScreen.tsx   → nueva, mismos campos que RelevoModal de coe
  shell/Shell.tsx           → +1 enlace (Relevo de mando) + contador "N sin sincronizar"
  router.tsx                → +1 ruta /relevo-mando
  App.tsx                   → listener "online" → flushColaOffline() + relogin si 401
```

Las 4 pantallas existentes (`NuevaActivacionScreen`, `EvaluacionInicialScreen`,
`MarcadorIncidenteScreen`) cambian su llamada a `apiClient.apiFetch` directo por
`enviarOEncolar`.

## Code Style

Mismo estilo que el resto de `pmm`. `RelevoMandoScreen` se escribe como pantalla de ruta (no
modal) porque `pmm` no tiene el patrón de acciones flotantes de `coe` — coherente con la decisión
de navegación del ítem #9 (nav simple de enlaces).

## Testing Strategy

- `fake-indexeddb/auto` en `test-setup.ts` de `pmm` — cola limpia entre tests.
- `colaOffline.test.ts`: `enviarOEncolar` hace `POST` real cuando MSW responde 201 (no encola);
  encola cuando el `fetch` rechaza (simulando offline); `flushColaOffline` reintenta y limpia la
  cola en éxito; se detiene y no limpia el resto si un item devuelve 401.
- `ventanaSesion.test.ts`: `puedeEncolarNueva()` con `sesionIniciadaEn` reciente → `true`; con más
  de 24h → `false`.
- Ajustar los tests existentes de `NuevaActivacionScreen`/`EvaluacionInicialScreen`/
  `MarcadorIncidenteScreen` al nuevo wrapper (mismo comportamiento observable en el caso online).
- `RelevoMandoScreen.test.tsx`: mismo patrón que `EvaluacionInicialScreen.test.tsx` (rol
  restringido, `POST /relevos-mando` con los campos correctos).
- `App.test.tsx`: evento `online` con un item 401 en la cola → limpia sesión y vuelve a `Login`.

## Boundaries

- **Always:** los reintentos deben usar el mismo `id` generado al encolar (idempotencia,
  backend ya lo soporta).
- **Ask first:** cualquier cambio al backend (ninguno hace falta — el `id` client-generado en los 3
  writes que hoy no lo mandan ya es aceptado por los endpoints existentes, a verificar en `verify`
  antes de asumirlo).
- **Never:** agregar un endpoint de sync especial al backend (hueco 6.4 ya resuelto sin eso);
  aplicar last-write-wins a ninguna de estas 4 escrituras (ADR-6 las trata como insert-only, sin
  excepción); geolocalización GETAC (fuera de alcance, PRD sección 6).

## Success Criteria

- Con red cortada: las 4 acciones se completan sin error visible, quedan en IndexedDB, el contador
  del Shell sube.
- Al reconectar con sesión vigente: la cola se vacía sola, sin duplicados verificables contra el
  backend real (`GET` de cada entidad).
- Al reconectar con sesión vencida (más de 24h offline): la app pide login; tras loguearse, la cola
  pendiente se sincroniza sola.
- `npm run test --workspace=pmm`, `npm run lint --workspace=pmm` y `npm run build --workspace=pmm`
  limpios.

## Open Questions

Ninguna bloqueante tras la confirmación de Renzo del 2026-08-12. La decisión de agregar
`RelevoMandoScreen` (sección "Decisiones" #1) es necesaria para que ADR-6 sea cierto en la
práctica, no una opción — se valida en el gate igual que el resto.
