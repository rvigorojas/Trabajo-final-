# Spec: Cliente PMM — Evaluación inicial y Marcador de incidente (ítem #9 del BACKLOG.md)

Segunda y tercera pantalla real del Cliente PMM. Complemento de `FRONTEND-SPEC.md` sección 5
("Evaluación inicial", "Marcador de incidente"). Primera vez que `pmm` necesita más de una
pantalla — se arma un router acá (no antes, ítem #8 tenía una sola pantalla).

## Decisiones (asunciones a confirmar en el gate)

1. **Router y navegación**: `react-router` (misma versión que `coe`, `^8.3.0`), 3 rutas
   (`/nueva-activacion`, `/evaluacion-inicial`, `/marcador-incidente`). Sin diseño de navegación
   documentado para PMM en `Design.md` (que solo cubre Flujo A/B/C/D, todos del lado COE o de una
   sola pantalla) — se arma una barra simple de 3 enlaces/botones, no la barra de tabs +
   acciones flotantes de `coe` (esa complejidad la pide `Design.md` para el dashboard COE en vivo,
   no está documentada para el PMM de campo). El enlace a "Evaluación inicial" se oculta si el rol
   logueado no está en `ROLES_EDICION_EVALUACION_RELEVO` (mismo criterio que `FloatingActions` de
   `coe`, ítem #2).
2. **Sin relevo de mando en PMM en este ítem**: `FRONTEND-SPEC.md` dice que el modal de Relevo "es
   reutilizable entre COE y PMM", pero ningún ítem del backlog (ni el #6 que lo construyó, ni este)
   pide agregarlo a `pmm` — no se agrega acá, fuera de alcance de "Evaluación inicial y Marcador".
3. **Badge "sin sincronizar" es del envío en curso, no de una cola persistente**: el ítem #10
   agrega la cola offline real (IndexedDB, persistencia entre reinicios de la app, reintento al
   reconectar) — ese ítem depende explícitamente de este (`#8, #9, #6`). En este ítem, el badge
   solo refleja el estado del `POST` que se está enviando ahora mismo (visible mientras está en
   vuelo o si falló y no se reintentó todavía) — no sobrevive a un refresh de la página. Es un
   paso intermedio real hacia el comportamiento final del ítem #10, no una simulación falsa.
4. **Evaluación inicial no tiene badge de sincronización** (a diferencia de Marcador): ni
   `BACKLOG.md` ni `FRONTEND-SPEC.md` lo piden para esa pantalla — solo error simple si el `POST`
   falla.

## Objective

- **`EvaluacionInicialScreen`**: `magnitud` (texto) + `riesgos_secundarios` (texto, opcional),
  `activacion_id` resuelto de la activación en curso (no se vuelve a pedir tipo de incidente, ya
  está en `Activacion`). Rol restringido a `ROLES_EDICION_EVALUACION_RELEVO`. `POST
  /evaluaciones-iniciales`.
- **`MarcadorIncidenteScreen`**: `coordenada_cuadricula` (texto, input manual — sin geolocalización
  GETAC, PRD sección 6, fuera de alcance v1), `tipo_incidente` (texto), `riesgo` (texto, opcional),
  `capa` (select: Cuadrícula/Incidente/Accesos — sin "Unidades", fase 2 deshabilitada). Sin
  restricción de rol (backend: "cualquiera"). `POST /marcadores-incidente`, badge "sin
  sincronizar" mientras el envío está en curso.

Fuente: `FRONTEND-SPEC.md` sección 5 ("Evaluación inicial", "Marcador de incidente"), líneas
212-223.

**Éxito:** un usuario PMM con el rol correcto completa una evaluación inicial de la activación en
curso; cualquier usuario PMM registra un marcador de incidente viendo el badge "sin sincronizar"
mientras se envía y su desaparición al confirmarse.

## Tech Stack

- `react-router@^8.3.0` nuevo en `apps/pmm/package.json` (misma versión que `coe`).
- Reutiliza `EvaluacionInicial`/`MarcadorIncidente`/`CapaMapa` de `@pce/api-client` (ya existen,
  ítem #3/#4). Sin tipos TS nuevos.

## Commands

`npm install react-router@^8.3.0 --workspace=pmm`, resto igual que ítems anteriores.

## Project Structure

```
apps/pmm/src/
  roles.ts                              → ROLES_EDICION_EVALUACION_RELEVO (copia de coe/roles.ts)
  router.tsx                            → 3 rutas + Shell simple con nav de 3 enlaces
  lib/
    activacionActual.ts                 → copia del de coe (GET /activaciones + filtro "activa")
  screens/
    EvaluacionInicialScreen.tsx
    MarcadorIncidenteScreen.tsx
```

`App.tsx`: pasa de renderizar `<NuevaActivacionScreen />` directo a `<RouterProvider
router={router} />` (mismo patrón que `apps/coe/src/App.tsx`).

## Code Style

Mismo estilo que las pantallas ya existentes de `pmm`/`coe`. `activacionActual.ts` se duplica
(no se comparte entre apps) — mismo criterio ya aplicado en el ítem #8 con `apiClient.ts`, no hay
un tercer caso de uso todavía que justifique moverlo a un paquete compartido.

## Testing Strategy

- Vitest + RTL + MSW (mismo patrón, `happy-dom` ya configurado en `pmm` desde el ítem #7 —
  necesario para `RouterProvider`, mismo gotcha que `coe` ítem #2).
- `EvaluacionInicialScreen.test.tsx`: con MSW, `POST /evaluaciones-iniciales` recibe
  `activacion_id`/`magnitud`/`riesgos_secundarios` correctos.
- `MarcadorIncidenteScreen.test.tsx`: con MSW y un `POST` controlado por promesa (para observar el
  estado intermedio), confirma que el badge aparece mientras la request está en vuelo y desaparece
  tras la respuesta 201.
- Ajustar `router.tsx`/tests existentes de `pmm` (`App.test.tsx`) al nuevo árbol de rutas, mismo
  patrón que `coe` (`createMemoryRouter` en los tests).

## Boundaries

- **Always:** resolver la activación en curso al entrar a cada pantalla (no asumir un
  `activacion_id` fijo).
- **Ask first:** cualquier cambio al backend (ninguno hace falta).
- **Never:** construir la cola offline real (IndexedDB, persistencia, reintento) — es el ítem #10;
  agregar geolocalización GETAC; agregar Relevo de mando a PMM en este ítem.

## Success Criteria

- Con el rol correcto y una activación en curso: completar Evaluación inicial dispara el `POST`
  correcto.
- Sin el rol correcto: el enlace a Evaluación inicial no aparece en la navegación.
- Completar Marcador de incidente dispara el `POST` correcto; el badge "sin sincronizar" es
  visible mientras la request está en vuelo y desaparece al confirmarse.
- `npm run test --workspace=pmm`, `npm run lint --workspace=pmm` y `npm run build --workspace=pmm`
  limpios.

## Open Questions

Ninguna bloqueante. La decisión de navegación (sección "Decisiones" #1) es una asunción de bajo
riesgo por falta de diseño documentado — ajustable sin impacto en datos si el usuario prefiere
otra estructura.
