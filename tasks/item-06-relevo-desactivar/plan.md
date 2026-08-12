# Plan: Ítem #6 del BACKLOG.md — Acciones rápidas: Relevo de mando y Desactivar

Insumos: `tasks/item-06-relevo-desactivar/spec.md` (validado), `FRONTEND-SPEC.md` sección 4,
`backend/app/schemas/relevo_mando.py` (`RelevoMandoCreate`), `backend/app/routers/
activaciones.py` (`POST /activaciones/{id}/desactivar`), `apps/coe/src/shell/FloatingActions.tsx`
(ítem #2, botones ya gateados por rol sin `onClick`).

## Componentes y dependencias

1. **`@radix-ui/react-dialog`** — nueva dependencia de `apps/coe`. Sin dependencias previas.
2. **`RelevoModal.tsx`** — `Dialog` de Radix. Al abrirse: `GET /activaciones` +
   `activacionActual` (ítem #3) para resolver la activación en curso; si no hay ninguna, muestra
   un aviso en vez del formulario. Formulario controlado (`instancia`, `responsable_saliente`,
   `responsable_entrante`); `onSubmit` dispara `POST /relevos-mando` con
   `hora_evento: new Date().toISOString()` y cierra el modal. Depende de (1).
3. **`DesactivarModal.tsx`** — mismo patrón de resolución de activación en curso que (2). Muestra
   el `tipo_incidente` de la activación a desactivar + 2 botones ("Cancelar"/"Confirmar").
   Confirmar dispara `POST /activaciones/{id}/desactivar` y cierra el modal. Depende de (1).
4. **`FloatingActions.tsx` (modificado)** — agrega `useState<"relevo" | "desactivar" | null>` para
   el modal abierto; `onClick` de cada botón lo setea; renderiza `<RelevoModal>`/
   `<DesactivarModal>` condicionalmente con un `onClose` que vuelve el estado a `null`. Depende de
   (2) y (3).

## Orden de implementación

(1) → { (2), (3) en paralelo — modales independientes } → (4).

No hay nada después de este ítem dentro de este plan — el Cliente COE queda completo en su
alcance actual. Siguiente trabajo del backlog es el Cliente PMM (ítems #7-#10).

## Riesgos y mitigación

- **No romper los 3 tests existentes de `FloatingActions.test.tsx`** (gateo por rol, sin red):
  agregar los casos nuevos de apertura de modal como tests adicionales en el mismo archivo, no
  reescribir los existentes — deben seguir pasando sin MSW porque solo verifican visibilidad de
  botones antes de cualquier click.
- **Doble submit en Desactivar**: como el backend es idempotente, no hay riesgo real de estado
  inconsistente — pero el botón "Confirmar" debe deshabilitarse mientras la request está en vuelo
  para evitar 2 clicks accidentales generando 2 requests (cosmético, no de datos).
- **`instancia` del relevo vs. `instancia_principal` del usuario logueado**: son conceptos
  distintos (`Instancia` = `"coe" | "pmm_ci"` del relevo en sí, `InstanciaPrincipal` = `"coe" |
  "pmm"` del usuario) — el select del modal no debe auto-completarse con la instancia del usuario
  logueado sin que el spec lo pida; queda como selección manual del usuario, tal como describe
  `FRONTEND-SPEC.md`.
- **Sin activación en curso al abrir el modal**: mostrar un aviso simple ("No hay una activación
  en curso") en vez de un formulario roto — cubierto en el spec como comportamiento esperado, no
  un caso de error a ocultar.

## Checkpoints de verificación

- Después de (1): `npm install` sin errores, `@radix-ui/react-dialog` en `package.json` de `coe`.
- Después de (2): test con MSW — completar el formulario de Relevo y enviar confirma el `POST`
  con los 4 campos correctos.
- Después de (3): test con MSW — confirmar Desactivar dispara el `POST` contra el `id` correcto.
- Después de (4): los 3 tests existentes de `FloatingActions.test.tsx` siguen en verde; 2 tests
  nuevos confirman que cada botón abre su modal correspondiente.
- Verificación manual final contra backend real (mismo patrón que ítems anteriores): registrar un
  relevo real y confirmar que aparece en Cadena de mando; desactivar una activación real y
  confirmar que Resumen redirige (ya construido en el ítem #3).
