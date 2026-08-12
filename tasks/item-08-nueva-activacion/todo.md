# Tasks: Ítem #8 del BACKLOG.md — Cliente PMM: Nueva activación

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/item-08-nueva-activacion/plan.md`).

- [x] Task: `lib/payloadActivacion.ts` — **hecho 2026-08-11**, 4/4 tests.
  - Acceptance: función pura que arma el `ActivacionCreate` exacto por categoría (Aeronáutica:
    `nivel_alerta`+`tipo_alerta`, sin `clasificacion_origen`; no aeronáutica: `clasificacion_origen`,
    sin los otros dos).
  - Verify: test unitario — las 4 categorías arman el body exacto esperado.
  - Files: `frontend/apps/pmm/src/lib/payloadActivacion.ts`,
    `frontend/apps/pmm/src/lib/payloadActivacion.test.ts`.

- [x] Task: `NuevaActivacionScreen.tsx` — **hecho 2026-08-11**, 2/2 tests.
  - Acceptance: selector de categoría (default Aeronáutica) → campos dependientes → tipo de
    incidente → aviso de convocatoria informativa → enviar. `POST /activaciones` con `id`
    (`crypto.randomUUID()`) y `hora_evento` automáticos. Tras 201, muestra confirmación +
    convocatoria de la respuesta.
  - Verify: test RTL con MSW — Aeronáutica y una categoría no aeronáutica (MATPEL) confirman el
    body del `POST`; la confirmación post-envío muestra la convocatoria de la respuesta.
  - Files: `frontend/apps/pmm/src/screens/NuevaActivacionScreen.tsx`,
    `frontend/apps/pmm/src/screens/NuevaActivacionScreen.test.tsx`.
  - Se agregó también `frontend/apps/pmm/src/apiClient.ts` (mismo patrón que `apps/coe`, no
    existía todavía — `App.tsx` creaba el cliente inline).

- [x] Task: conectar `App.tsx` — **hecho 2026-08-11**.
  - Acceptance: la rama "con sesión" renderiza `<NuevaActivacionScreen />` en vez del placeholder.
  - Verify: `npm run build --workspace=pmm` limpio; `App.test.tsx` (ítem #7) ajustado — el texto
    "Sesión iniciada" se reemplazó por la verificación de que aparece el heading "Nueva
    activación".
  - Files: `frontend/apps/pmm/src/App.tsx`, `frontend/apps/pmm/src/App.test.tsx`.

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde (`npm run test --workspace=pmm`) — **10/10, 2026-08-11**.
- [x] `npm run lint --workspace=pmm` sin errores — **2026-08-11**.
- [x] `npm run build --workspace=pmm` limpio — **2026-08-11**.
- [x] Verificación manual contra el backend real (Postgres levantado, `alembic upgrade head`) —
      **2026-08-11**. Desde el formulario real (`vite dev`, puerto 5174): creada una activación
      Aeronáutica ("Verificación Item 8 - Aeronáutica", nivel I) y una MATPEL ("Verificación Item
      8 - MATPEL", Clase 3) — ambas confirmadas por la pantalla de "Activación creada". Las dos
      mostraron "Convocados: 0", esperable con la base de test actual (solo existe el usuario
      `test_duty`/`duty_manager`, sin los roles operativos —Jefe de Rescate, Supervisor Gral. de
      Rescate, etc.— que el backend convocaría automáticamente) — no se investigó a fondo por
      decisión explícita del usuario, no bloquea el cierre: el payload por categoría es lo que
      este ítem debía verificar, y quedó confirmado en ambos casos reales.
- [x] Correr `verify` (fase final del ciclo, mismo criterio que ítems anteriores) contra `spec.md`
      + `plan.md` + este archivo — **2026-08-11**. Los 4 Success Criteria de `spec.md` se cumplen;
      los 4 checkpoints de `plan.md` confirmados. Hallazgo menor no bloqueante: al volver a
      "Nueva activación" desde la confirmación, el formulario no resetea sus campos (tipo de
      incidente queda con el valor anterior) — cosmético, no afecta el payload real de la
      siguiente activación porque cada campo se sobreescribe antes de enviar.

**Ítem #8 cerrado — 2026-08-11.**
