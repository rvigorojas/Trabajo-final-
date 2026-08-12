# Spec: Acciones rápidas — Relevo de mando y Desactivar (ítem #6 del BACKLOG.md)

Complemento de `FRONTEND-SPEC.md` sección 4 ("Relevo de mando", "Desactivar"). Los botones ya
existen (`FloatingActions.tsx`, ítem #2), gateados por rol, pero sin `onClick` — este ítem los
conecta a acciones reales. Cierra el Cliente COE en su alcance actual (el Cliente PMM, ítems
#7-#10, reutiliza el mismo modal de Relevo — `FRONTEND-SPEC.md` sección 5 — pero construirlo ahí
es trabajo de esos ítems, no de este).

## Decisiones (asunciones a confirmar en el gate, no bloqueantes)

1. **Ambas acciones requieren una activación en curso**: `RelevoMandoCreate` exige
   `activacion_id`, y desactivar exige el `id` de la activación a cerrar. Si no hay ninguna
   activación con `estado: "activa"` al momento de abrir el modal, el botón simplemente no debería
   tener con qué actuar — se resuelve buscando la activación en curso al abrir el modal
   (`activacionActual` + `GET /activaciones`, mismo patrón que `ResumenScreen`/`MapaScreen`), y si
   no hay ninguna, el modal muestra un aviso en vez del formulario (no debería ocurrir en la
   práctica, ya que los botones solo tienen sentido durante una emergencia activa, pero no hay
   documentación que impida clickearlos sin activación).
2. **Desactivar pide una confirmación explícita dentro del propio modal** (no un `window.confirm`
   nativo — no está documentado en `FRONTEND-SPEC.md`, pero es una acción que cierra una emergencia
   real; un modal con "¿Confirmás desactivar la activación actual?" y dos botones es consistente
   con el resto de la UI y evita un cierre accidental por mal click). Idempotente del lado del
   backend de todos modos.
3. **Nuevo dependency**: `@radix-ui/react-dialog` (no está instalado aún) — mismo patrón que
   `@radix-ui/react-tabs`/`@radix-ui/react-dropdown-menu` del ítem #2, primer uso de `Dialog`.

## Objective

- **Modal de Relevo de mando**: `instancia` (select COE/PMM → `"coe"` | `"pmm_ci"`),
  `responsable_saliente`, `responsable_entrante` (texto) → `POST /relevos-mando` con
  `activacion_id` de la activación en curso y `hora_evento = new Date().toISOString()`.
- **Modal de Desactivar**: confirmación → `POST /activaciones/{id}/desactivar` con el `id` de la
  activación en curso.
- Ambos modales se abren desde `FloatingActions.tsx` (visibles en todas las pantallas), respetando
  el gateo por rol ya existente (`ROLES_EDICION_EVALUACION_RELEVO`, `ROLES_DESACTIVACION`).

Fuente: `FRONTEND-SPEC.md` sección 4 (Relevo de mando, Desactivar), líneas 184-192.

**Éxito:** un usuario con el rol correcto puede registrar un relevo de mando o desactivar la
activación en curso desde cualquier pantalla, sin navegar a ningún lado — y `CadenaDeMandoScreen`/
`ResumenScreen` reflejan el cambio en su siguiente ciclo de polling (ya construido en ítems
anteriores, sin cambios necesarios ahí).

## Tech Stack

- `@radix-ui/react-dialog` nuevo en `apps/coe/package.json`.
- Reutiliza `activacionActual` (`lib/activacionActual.ts`, ítem #3) y `apiClient.apiFetch`.
- Sin tipos TS nuevos — `RelevoMando`/`Instancia`/`ActivacionConConvocatoria` ya existen.

## Commands

Mismos de ítems anteriores, alcance `coe`. Agregar dependencia: `npm install
@radix-ui/react-dialog --workspace=coe`.

## Project Structure

Nuevo dentro de `frontend/apps/coe/src/shell/`:

```
src/shell/
  RelevoModal.tsx        → formulario de relevo (instancia + responsables) → POST /relevos-mando
  DesactivarModal.tsx    → confirmación → POST /activaciones/{id}/desactivar
```

`FloatingActions.tsx` se modifica para manejar el estado de qué modal está abierto y renderizarlo.

## Code Style

Mismo estilo que el resto de `shell/` (`TabBar.tsx`, `MenuAparte.tsx`): componentes función,
Radix como primitivo sin envoltorios de diseño extra.

## Testing Strategy

- Vitest + RTL + MSW.
- `FloatingActions.test.tsx` (existente): agregar casos que confirman que clickear "Relevo de
  mando"/"Desactivar" abre el modal correspondiente — sin romper los 3 tests de gateo por rol ya
  existentes (que no interactúan con la red, solo confirman visibilidad de los botones).
- `RelevoModal.test.tsx`: con MSW, mockear `GET /activaciones` (una activa) y `POST
  /relevos-mando`; completar el formulario y enviar confirma el `POST` con `activacion_id`,
  `instancia`, `responsable_saliente`, `responsable_entrante` correctos.
- `DesactivarModal.test.tsx`: con MSW, mockear `GET /activaciones` y `POST
  /activaciones/{id}/desactivar`; confirmar el modal de confirmación y que el `POST` se dispara
  contra el `id` correcto.

## Boundaries

- **Always:** buscar la activación en curso al abrir cada modal (no asumir un `activacion_id` fijo
  ni pasarlo por props desde la pantalla actual — los botones son globales, no saben en qué
  pantalla está el usuario).
- **Ask first:** cualquier cambio al backend (ninguno debería hacer falta, ambos endpoints ya
  existen y están verificados).
- **Never:** usar `window.confirm`/`alert` nativos (rompen la automatización de pruebas y no son
  consistentes con el resto de la UI); construir el modal de Relevo del Cliente PMM en este ítem
  (es de los ítems #7-#10, aunque reutilice este mismo componente si el monorepo lo permite — decisión
  de esos ítems, no de este).

## Success Criteria

- Con una activación activa y el rol correcto: clickear "Relevo de mando" abre el modal, completar
  y enviar dispara el `POST` correcto y cierra el modal.
- Con una activación activa y el rol correcto: clickear "Desactivar" abre la confirmación,
  confirmar dispara el `POST` correcto y cierra el modal.
- Sin el rol correcto, los botones ni siquiera aparecen (comportamiento ya existente del ítem #2,
  sin cambios).
- `npm run test --workspace=coe`, `npm run lint --workspace=coe` y `npm run build --workspace=coe`
  limpios.

## Open Questions

Ninguna bloqueante. Las asunciones de "Decisiones" (activación en curso requerida, confirmación
dentro del modal, dependencia nueva de Radix) se validan en el gate de Specify antes de Plan.
