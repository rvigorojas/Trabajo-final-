# Plan: Ítem #9 del BACKLOG.md — Cliente PMM: Evaluación inicial y Marcador de incidente

Insumos: `tasks/item-09-evaluacion-marcador/spec.md` (validado), `apps/coe/src/lib/
activacionActual.ts`, `apps/coe/src/shell/roles.ts`, `apps/coe/src/router.tsx` (patrones a
replicar en `pmm`).

## Componentes y dependencias

1. **`react-router`** — instalar en `pmm` (misma versión que `coe`). Sin dependencias previas.
2. **`lib/activacionActual.ts`** (copia de `coe`) — sin dependencias previas, en paralelo con (1).
3. **`roles.ts`** (copia de `coe`, solo `ROLES_EDICION_EVALUACION_RELEVO` — `pmm` no necesita
   `ROLES_DESACTIVACION`, ese botón no se agrega acá) — sin dependencias previas, en paralelo.
4. **`EvaluacionInicialScreen.tsx`** — formulario `magnitud`/`riesgos_secundarios`, resuelve
   activación en curso con (2), gatea acceso con (3) (si el rol no está en la lista, muestra aviso
   en vez del formulario — mismo criterio que ocultar, no solo deshabilitar, ya usado en
   `FloatingActions` de `coe`). `POST /evaluaciones-iniciales`. Depende de (2), (3).
5. **`MarcadorIncidenteScreen.tsx`** — formulario `coordenada_cuadricula`/`tipo_incidente`/
   `riesgo`/`capa`, resuelve activación en curso con (2). Estado local `enviando` controla el
   badge "sin sincronizar" (visible mientras la promesa del `POST` no resuelve). `POST
   /marcadores-incidente`. Depende de (2).
6. **`router.tsx`** — 3 rutas (`/nueva-activacion`, `/evaluacion-inicial`,
   `/marcador-incidente`) + `Shell` simple con 3 enlaces (el de Evaluación inicial oculto sin el
   rol correcto). Depende de (4), (5) y de `NuevaActivacionScreen` (ítem #8, ya existe).
7. **`App.tsx` (modificado)** — con sesión, `<RouterProvider router={router} />` en vez de
   `<NuevaActivacionScreen />` directo (mismo patrón que `coe`). Depende de (6).

## Orden de implementación

{ (1), (2), (3) en paralelo } → { (4), (5) en paralelo } → (6) → (7).

Siguiente ítem del backlog: #10 (Cola offline y token blando), que reemplaza el envío directo de
(4)/(5) por una cola persistente real.

## Riesgos y mitigación

- **`react-router` + `happy-dom`**: mismo gotcha ya documentado en `CLAUDE.md` (ítem #2 de
  `coe`) — `pmm` ya usa `happy-dom` desde el ítem #7, así que no hace falta ningún cambio de
  entorno de test, solo tenerlo presente.
- **Rol oculto vs. deshabilitado**: el enlace a Evaluación inicial debe desaparecer por completo
  sin el rol correcto, no aparecer deshabilitado — mismo criterio ya aplicado y testeado en
  `FloatingActions` de `coe` (ítem #2), para no repetir esa discusión de diseño.
- **Badge "sin sincronizar" con MSW en tests**: para observar el estado intermedio (badge visible
  mientras la request está en vuelo) hace falta un handler MSW que no resuelva inmediatamente —
  usar una promesa controlada manualmente (`new Promise(resolve => ...)` guardando el `resolve`)
  en vez de un `setTimeout`, para que el test sea determinístico.
- **`activacionActual.ts` duplicado entre `coe` y `pmm`**: aceptado explícitamente en `spec.md`
  ("Code Style") — no mover a un paquete compartido sin un tercer caso de uso real.

## Checkpoints de verificación

- Después de (1)-(3): `npm run build --workspace=pmm` sigue limpio (nada roto por las nuevas
  dependencias/archivos todavía sin usar).
- Después de (4): test con MSW — completar y enviar confirma el `POST` con `activacion_id`/
  `magnitud`/`riesgos_secundarios` correctos.
- Después de (5): test con MSW (promesa controlada) — badge visible durante el envío, desaparece
  tras la respuesta 201; `POST` con los 4 campos correctos.
- Después de (6)-(7): navegar entre las 3 pantallas funciona; el enlace de Evaluación inicial se
  oculta sin el rol correcto (test con `getClaims` mockeado, mismo patrón que
  `FloatingActions.test.tsx` de `coe`).
- Verificación manual final contra backend real: con la activación en curso creada en el ítem #8,
  completar una evaluación inicial real y un marcador real; confirmar por `GET
  /evaluaciones-iniciales`/`GET /marcadores-incidente` que quedaron con los campos correctos.
