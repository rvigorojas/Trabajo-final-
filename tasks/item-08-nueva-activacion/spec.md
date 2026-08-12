# Spec: Cliente PMM — Nueva activación (ítem #8 del BACKLOG.md)

Primera pantalla real del Cliente PMM. Complemento de `FRONTEND-SPEC.md` sección 5 ("Nueva
activación", Flujo A variante 1c) y sección 2 ("Validación de `POST /activaciones` por
categoría"). Construye sobre el ítem #7 (`App.tsx` ya gatea por sesión, `ActualizacionDisponible`
ya está montada).

## Decisiones (asunciones a confirmar en el gate)

1. **Sin router todavía**: con una sola pantalla real, `App.tsx` reemplaza el placeholder
   ("Sesión iniciada") por `<NuevaActivacionScreen />` directo — no se arma `react-router` en este
   ítem. Se arma cuando el ítem #9 agregue una segunda pantalla real (Evaluación inicial/
   Marcador), no antes (mismo criterio de "no construir para casos hipotéticos" ya aplicado en
   ítems anteriores).
2. **Convocatoria COE/PMM es informativa, no un campo del formulario**: el backend auto-convoca al
   crear la activación (no hay lista de convocados que el cliente arme) — se muestra como aviso
   estático antes de enviar, y como resumen (cantidad de convocados por instancia) después de la
   respuesta 201.
3. **Sin cola offline en este ítem**: el ítem #10 agrega la persistencia local/reintento. Si el
   `POST /activaciones` falla acá (offline real, sin red), el formulario muestra un error y no
   pierde los datos ingresados — pero no los encola ni reintenta solo todavía.
4. **`id` generado client-side con `crypto.randomUUID()`** (ADR-6, disponible nativo en navegadores
   modernos — no hace falta una librería de UUID).

## Objective

`NuevaActivacionScreen`: selector de categoría (Aeronáutica preseleccionada) → selector de escala
dependiente de la categoría → tipo de incidente → hora automática → aviso de convocatoria
informativa → enviar. Payload exacto por categoría (`FRONTEND-SPEC.md` sección 2):

- Aeronáutica: `nivel_alerta` (`I|II|III`) + `tipo_alerta` (1-10), sin `clasificacion_origen`.
- Epidemiológica: `clasificacion_origen` ∈ `EMERGENCIA|URGENCIA|CONSULTA`.
- Estructural/Incidentes: `clasificacion_origen` ∈ `Estructural|Incidente`.
- MATPEL: `clasificacion_origen` ∈ `Clase 1`…`Clase 9` (siempre deriva a activación general,
  confirmado con el Jefe de Rescate 2026-08-11).

Fuente: `FRONTEND-SPEC.md` sección 5 ("Nueva activación"), líneas 201-210; sección 2, líneas 78-94.

**Éxito:** un usuario PMM completa la categoría + escala + tipo de incidente correctos para su
categoría, envía, y ve confirmación con la convocatoria generada automáticamente — sin poder
armar un payload inválido (mezclar `nivel_alerta` con `clasificacion_origen`, por ejemplo).

## Tech Stack

- Mismo stack de `pmm` del ítem #7 (React+Vite+TS, Tailwind, Vitest+RTL+MSW+happy-dom).
- Sin tipos TS nuevos — `ActivacionCreate`/`ActivacionConConvocatoria`/`TipoEmergencia`/
  `NivelAlerta` ya existen en `@pce/api-client` (ítem #1).

## Commands

Mismos de `pmm` del ítem #7.

## Project Structure

```
apps/pmm/src/
  screens/
    NuevaActivacionScreen.tsx      → formulario completo
  lib/
    payloadActivacion.ts           → arma el body correcto según categoría (función pura,
                                      testeable sin red — evita el bug de mezclar campos)
```

`App.tsx`: reemplaza el placeholder por `<NuevaActivacionScreen />` en la rama "con sesión".

## Code Style

Componente función, `apiClient.apiFetch` directo (mismo patrón que `coe`). La construcción del
payload se separa en una función pura (`payloadActivacion.ts`) para poder testear las 4
combinaciones de categoría sin montar el formulario completo — mismo criterio que
`lib/activacionActual.ts`/`lib/ultimosEventos.ts` de `coe` (ítem #3).

## Testing Strategy

- `payloadActivacion.test.ts`: las 4 categorías arman el body exacto esperado (sin campos de más).
- `NuevaActivacionScreen.test.tsx`: con MSW, completar el formulario para Aeronáutica y para una
  categoría no aeronáutica (ej. MATPEL) y confirmar que el `POST /activaciones` recibe el body
  correcto en cada caso; confirmar que la pantalla muestra la convocatoria de la respuesta.

## Boundaries

- **Always:** armar el payload según la categoría elegida — nunca enviar `nivel_alerta`/
  `tipo_alerta` fuera de Aeronáutica, nunca enviar `clasificacion_origen` en Aeronáutica (el
  backend rechaza con 422 si se mezclan, pero el cliente no debe depender de que el backend lo
  atrape).
- **Ask first:** cualquier cambio al backend (ninguno hace falta, `POST /activaciones` ya valida
  todo esto server-side).
- **Never:** construir router o pantallas de los ítems #9/#10 en este ítem; construir cola offline
  en este ítem (es el #10); dejar que el usuario elija manualmente a quién convocar (el backend
  auto-convoca).

## Success Criteria

- Categoría Aeronáutica: el formulario pide `nivel_alerta` + `tipo_alerta`, arma y envía el
  payload correcto.
- Cualquier categoría no aeronáutica: el formulario pide `clasificacion_origen` (con las opciones
  exactas de esa categoría), arma y envía el payload correcto.
- Tras un `POST` exitoso (201), la pantalla muestra confirmación con la convocatoria generada.
- `npm run test --workspace=pmm`, `npm run lint --workspace=pmm` y `npm run build --workspace=pmm`
  limpios.

## Open Questions

Ninguna bloqueante. El criterio MATPEL, único punto pendiente real de este ítem, ya se confirmó
(ver bitácora, "Confirmación externa" 2026-08-11). Heredadas sin bloquear: ventana de 12h del
token blando y sync con token vencido (ítem #10).
