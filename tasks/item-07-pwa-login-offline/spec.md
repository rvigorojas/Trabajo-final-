# Spec: Cliente PMM — Setup PWA y login offline (ítem #7 del BACKLOG.md)

Primer ítem del Cliente PMM. Complemento de `FRONTEND-SPEC.md` sección 5 ("Login", "Mecanismo de
cola offline" — la parte de versionado del PWA) y ADR-4. `apps/pmm` existe desde el ítem #1
(scaffold, Tailwind + tokens, `Login` compartido de `@pce/api-client`) pero **sin tooling de test
propio** (Vitest/RTL/MSW nunca se agregaron ahí — solo a `coe`, en los ítems #1/#2) y con
`App.tsx` mostrando `<Login>` siempre, sin gatear por sesión existente.

## Decisiones (asunciones a confirmar en el gate)

1. **Este ítem agrega el tooling de test a `pmm`** (Vitest + RTL + MSW + `happy-dom`, mismo
   `vitest.config.ts`/`test-setup.ts` que `coe`) — necesario para poder escribir cualquier test de
   este ítem en adelante. No es parte del backlog original como línea propia, pero sin esto no hay
   forma de verificar nada de los ítems #7-#10 con tests automatizados.
2. **Sin pantallas reales todavía**: los ítems #8/#9/#10 construyen Nueva activación/Evaluación
   inicial/Marcador/cola offline. Este ítem solo necesita *algo* que renderizar después del login
   para probar que el gateo funciona — un placeholder simple ("Sesión iniciada"), no un router
   todavía (a diferencia de `coe`, que sí lo tiene desde el ítem #2). El router real de `pmm` se
   arma cuando haya más de una pantalla que enrutar (ítem #8 en adelante).
3. **Verificación real del Service Worker requiere build de producción**: Vite no ejecuta el SW en
   `vite dev` salvo que se fuerce `devOptions.enabled`. La verificación manual de "aviso de
   actualización disponible" se hace contra `vite build && vite preview`, no contra el dev server
   — documentado como limitación conocida, no como hueco sin resolver.

## Objective

- **Login offline**: `App.tsx` de `pmm` gatea por `getToken()` (mismo patrón que `coe`, ítem #1) —
  si ya hay una sesión guardada, no llama al backend al arrancar, renderiza directo el contenido
  post-login. Sin sesión, muestra `<Login>`.
- **PWA**: `vite-plugin-pwa` configurado en `apps/pmm/vite.config.ts` con `registerType:
  "prompt"` (nunca `"autoUpdate"` silencioso — ADR-4 exige avisar, no aplicar caché vieja en
  silencio). Componente `ActualizacionDisponible` que usa `virtual:pwa-register/react`
  (`useRegisterSW`) para mostrar un aviso "Actualización disponible" con un botón que llama a
  `updateServiceWorker(true)` cuando `needRefresh` es `true`.

Fuente: `FRONTEND-SPEC.md` sección 5 (Login, Versionado del PWA), líneas 196-199 y 248-249; ADR-4.

**Éxito:** cerrar y reabrir la pestaña con una sesión ya guardada no dispara ninguna llamada al
backend antes de mostrar contenido; una nueva versión desplegada del PWA se avisa explícitamente
al usuario en vez de aplicarse en silencio.

## Tech Stack

- `vite-plugin-pwa` nuevo en `apps/pmm/package.json`.
- Vitest + RTL + MSW + `happy-dom` nuevos en `apps/pmm/package.json` (mismas versiones que `coe`).
- Sin tipos TS nuevos.

## Commands

`npm install vite-plugin-pwa --workspace=pmm` +
`npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom msw --workspace=pmm`.
`npm run test/lint/build --workspace=pmm` (agrega el script `test` que hoy no existe en
`apps/pmm/package.json`).

## Project Structure

```
apps/pmm/src/
  vitest.config.ts, test-setup.ts     → mismo patrón que apps/coe (ítem #1/#2)
  mocks/server.ts                     → MSW propio de pmm (BASE_URL + handlers por defecto)
  App.tsx                             → modificado: gateo por getToken(), placeholder post-login
  components/ActualizacionDisponible.tsx → aviso de nueva versión del PWA
apps/pmm/vite.config.ts               → agrega VitePWA()
```

## Code Style

Mismo estilo que `apps/coe/src/App.tsx` para el gateo de sesión — reutilizar el patrón, no
inventar uno nuevo.

## Testing Strategy

- `App.test.tsx`: sin token → muestra `Login`; con token en `localStorage` → muestra el
  placeholder sin que se dispare ningún `fetch` (confirmable con MSW sin handlers — si hiciera una
  request no interceptada, `onUnhandledRequest: "error"` la haría fallar).
- `ActualizacionDisponible.test.tsx`: mockear `virtual:pwa-register/react` (`vi.mock`) — con
  `needRefresh: true` muestra el aviso y el botón llama a `updateServiceWorker`; con
  `needRefresh: false` no renderiza nada.

## Boundaries

- **Always:** el gateo de sesión no debe hacer ninguna llamada de red antes de decidir qué
  renderizar (requisito explícito de "funcionar sin conexión si ya había una sesión previa").
- **Ask first:** cualquier cambio al backend (ninguno hace falta en este ítem).
- **Never:** `registerType: "autoUpdate"` (aplicaría una versión nueva sin avisar, en contra de
  ADR-4); construir el router/las pantallas reales de PMM en este ítem (son los ítems #8-#10).

## Success Criteria

- Sin sesión guardada: `pmm` muestra `Login`.
- Con sesión guardada (token en `localStorage`): `pmm` muestra el placeholder post-login sin
  llamar al backend.
- `VitePWA` configurado con `registerType: "prompt"`; `ActualizacionDisponible` muestra el aviso
  cuando `needRefresh` es verdadero.
- `npm run test --workspace=pmm`, `npm run lint --workspace=pmm` y `npm run build --workspace=pmm`
  limpios.

## Open Questions

Ninguna bloqueante. Las 3 decisiones de la sección "Decisiones" se validan en el gate de Specify.
