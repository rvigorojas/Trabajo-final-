# Tasks: Ítem #6 del BACKLOG.md — Acciones rápidas: Relevo de mando y Desactivar

Cada task es completable en una sesión, con criterio de aceptación y verificación explícita.
Orden = orden de dependencia (ver `tasks/item-06-relevo-desactivar/plan.md`).

- [x] Task: instalar `@radix-ui/react-dialog` — **hecho 2026-08-11**.
  - Acceptance: agregado a `frontend/apps/coe/package.json` como dependencia.
  - Verify: `npm install` sin errores desde `frontend/`.
  - Files: `frontend/apps/coe/package.json`, `frontend/package-lock.json`.

- [x] Task: `RelevoModal.tsx` — **hecho 2026-08-11**, 2/2 tests.
  - Acceptance: `Dialog` de Radix. Resuelve la activación en curso al abrir (`GET /activaciones` +
    `activacionActual`); sin ninguna, muestra aviso. Formulario `instancia`/`responsable_saliente`/
    `responsable_entrante` → `POST /relevos-mando` con `hora_evento` actual, cierra al éxito.
  - Verify: test RTL con MSW — completar y enviar el formulario confirma el `POST` con los 4
    campos correctos.
  - Files: `frontend/apps/coe/src/shell/RelevoModal.tsx`,
    `frontend/apps/coe/src/shell/RelevoModal.test.tsx`.

- [x] Task: `DesactivarModal.tsx` — **hecho 2026-08-11**, 1/1 test.
  - Acceptance: `Dialog` de Radix. Resuelve la activación en curso al abrir, muestra su
    `tipo_incidente` + confirmación. Confirmar → `POST /activaciones/{id}/desactivar`, cierra al
    éxito.
  - Verify: test RTL con MSW — confirmar dispara el `POST` contra el `id` correcto.
  - Files: `frontend/apps/coe/src/shell/DesactivarModal.tsx`,
    `frontend/apps/coe/src/shell/DesactivarModal.test.tsx`.

- [x] Task: conectar `FloatingActions.tsx` — **hecho 2026-08-11**, 5/5 tests (3 existentes + 2
      nuevos).
  - Acceptance: estado de qué modal está abierto; `onClick` de cada botón lo abre; renderiza el
    modal correspondiente con `onClose`.
  - Verify: los 3 tests existentes de `FloatingActions.test.tsx` siguen en verde; 2 tests nuevos
    confirman que cada botón abre su modal.
  - Files: `frontend/apps/coe/src/shell/FloatingActions.tsx`,
    `frontend/apps/coe/src/shell/FloatingActions.test.tsx`.

## Verificación final del ítem

- [x] Todas las tasks anteriores en verde (`npm run test --workspace=coe`) — **28/28, 2026-08-11**.
- [x] `npm run lint --workspace=coe` sin errores — **2026-08-11**.
- [x] `npm run build --workspace=coe` limpio — **2026-08-11**.
- [x] Verificación manual contra el backend real (Postgres levantado, `alembic upgrade head`) —
      **2026-08-11**. Con la activación activa real del ítem #4 ("Prueba Item 4 - Mapa y
      Unidades"): "Relevo de mando" abrió el modal, se completó Instancia=COE, responsable
      saliente "Capitán Rojas", entrante "Capitán Vega" — confirmó el `POST` y cerró el modal;
      Cadena de mando mostró "Capitán Rojas → Capitán Vega" en el carril COE. "Desactivar" abrió
      la confirmación con el `tipo_incidente` real de la activación; confirmar cerró el modal y
      `GET /activaciones` por API mostró la activación con `estado: "cerrada"`; navegar a
      `/resumen` redirigió a `/cadena-de-mando` (comportamiento ya construido en el ítem #3, sin
      cambios). Detalle cosmético observado, no bloqueante: los `<input>` de texto del modal de
      Relevo no tienen borde visible contra el fondo oscuro hasta hacer foco — no afecta la
      funcionalidad, ajuste de estilos para otro momento.
- [x] Correr `verify` (fase final del ciclo, mismo criterio que ítems anteriores) contra `spec.md`
      + `plan.md` + este archivo — **2026-08-11**. Los 4 Success Criteria de `spec.md` se cumplen;
      los 5 checkpoints de `plan.md` confirmados. Sin hallazgos nuevos de lógica de negocio.

**Ítem #6 cerrado — 2026-08-11. Cliente COE completo en su alcance actual.**
