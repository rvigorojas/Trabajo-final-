# Plan: Ítem #4 del BACKLOG.md — Cliente COE: Mapa y Unidades

Insumos: `tasks/item-04-mapa-unidades/spec.md` (validado), `FRONTEND-SPEC.md` sección 4,
`backend/app/models/unidad.py`, `backend/app/schemas/unidad.py` (nuevos para este ítem);
`backend/app/models/marcador_incidente.py`, `backend/app/schemas/marcador_incidente.py` (ya
tipados en el ítem #3, sin cambios).

## Componentes y dependencias

1. **Tipos TS nuevos en `packages/api-client/src/types.ts`**: `EstadoUnidad` (`"ok" |
   "fuera_de_servicio" | "no_aplica"`, unión de string igual que `Instancia`/`CapaMapa`) y
   `Unidad` (`identificador`, `estado`, `hora_recepcion`), leídos campo por campo de
   `backend/app/models/unidad.py`/`schemas/unidad.py`. Sin dependencias previas de este ítem.
2. **`MapaScreen.tsx`** — `usePolling` (ítem #3) sobre `GET /activaciones` (reutilizando
   `activacionActual`, ítem #3) + `GET /marcadores-incidente`, filtrado client-side por el
   `activacion_id` de la activación en curso (mismo patrón ya usado en `ResumenScreen`). Estado
   local de capas activas (`useState<Set<CapaMapa>>`, default con `cuadricula`/`incidente`/
   `accesos` activas, `unidades_fase2` fija fuera del set y no clickeable). No depende de (1) —
   `MarcadorIncidente`/`CapaMapa` ya existen del ítem #3 — puede ir en paralelo.
3. **`UnidadesScreen.tsx`** — `usePolling` sobre `GET /unidades` (sin filtro). Por cada unidad, un
   `<select>` de estado; `onChange` dispara `PUT /unidades/{identificador}` y actualiza el estado
   local con la respuesta (no espera al siguiente ciclo de polling para reflejar el propio cambio,
   sí para reflejar cambios de otros clientes). Depende de (1).

## Orden de implementación

(1) en paralelo con (2) → (3).

No hay nada después de este ítem dentro de este plan — Pre-PAI/Reportes/Comunicaciones son el
ítem #5.

## Riesgos y mitigación

- **Filtrar marcadores sin activación en curso**: si `activacionActual` devuelve `null`, el filtro
  por `activacion_id` no tiene con qué comparar. Mitigación: en ese caso, `MapaScreen` renderiza
  la lista de marcadores vacía directamente (no llama al filtro con un id inexistente) — decisión
  ya tomada en `spec.md` (Mapa no redirige sin activación, a diferencia de Resumen).
- **Edición optimista vs. inconsistencia con el polling**: si se actualiza el estado local
  inmediatamente con la respuesta del `PUT` pero el siguiente ciclo de polling (hasta 3s después)
  trae un valor distinto (otro cliente lo cambió mientras tanto), el valor del polling debe ganar
  sin parpadeo raro — no requiere lógica especial porque `usePolling` ya sobrescribe el estado
  completo en cada ciclo (mismo comportamiento que `ResumenScreen`).
- **Toggle de capas y estado de checkbox "Unidades" deshabilitado**: usar `disabled` real en el
  control, no solo estilo visual, para que no sea clickeable ni por teclado.
- **Test de `PUT` con MSW**: usar `userEvent.selectOptions` (no `fireEvent.change`, que no dispara
  bien los eventos de React Testing Library en `<select>` con Radix/Tailwind) — mismo patrón que
  cualquier test de formulario ya usado en items anteriores, verificar contra
  `ResumenScreen.test.tsx` si hay un precedente de interacción con inputs.

## Checkpoints de verificación

- Después de (1): `tsc --noEmit` en `packages/api-client` sin errores con `EstadoUnidad`/`Unidad`.
- Después de (2): test con MSW — marcadores de dos activaciones distintas, confirma que solo los
  de la activación en curso se renderizan; desactivar una capa oculta sus marcadores; sin
  activación activa, la lista queda vacía sin redirect.
- Después de (3): test con MSW — cambiar el `<select>` de una unidad dispara `PUT
  /unidades/{identificador}` con el `estado` correcto en el body.
- Verificación manual final contra backend real (mismo patrón que el ítem #3): confirmar en
  navegador que cambiar el estado de una unidad persiste (recargar la pantalla y verlo reflejado).
