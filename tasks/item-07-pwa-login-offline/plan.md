# Plan: Ítem #7 del BACKLOG.md — Cliente PMM: Setup PWA y login offline

Insumos: `tasks/item-07-pwa-login-offline/spec.md` (validado), `FRONTEND-SPEC.md` sección 5,
`apps/coe/vitest.config.ts` + `test-setup.ts` + `mocks/server.ts` + `App.tsx` (patrones a
replicar), ADR-4.

## Componentes y dependencias

1. **Tooling de test de `pmm`**: copiar `vitest.config.ts` (`happy-dom`), `test-setup.ts` y
   `mocks/server.ts` (BASE_URL propio, sin handlers por defecto todavía — no hay pantallas que los
   necesiten) desde `apps/coe`, agregar el script `"test": "vitest run"` a `package.json`. Sin
   dependencias previas.
2. **`vite-plugin-pwa`**: instalar, configurar `VitePWA({ registerType: "prompt", ... })` en
   `apps/pmm/vite.config.ts`. Sin dependencias previas — en paralelo con (1).
3. **`ActualizacionDisponible.tsx`**: componente que usa `useRegisterSW` de
   `virtual:pwa-register/react`; si `needRefresh`, muestra aviso + botón que llama
   `updateServiceWorker(true)`. Depende de (2) (el tipo del hook viene del plugin).
4. **`App.tsx` (modificado)**: gatea por `getToken()` (mismo patrón que `apps/coe/src/App.tsx`);
   con token, renderiza un placeholder simple + `<ActualizacionDisponible />`; sin token, `<Login
   apiClient={apiClient} onSuccess={...} />`. Depende de (1) (para poder testearlo) y (3).

## Orden de implementación

{ (1), (2) en paralelo } → (3) → (4).

Siguiente ítem del backlog: #8 (Cliente PMM — Nueva activación), que sí necesita un router.

## Riesgos y mitigación

- **`virtual:pwa-register/react` no existe hasta que `vite-plugin-pwa` esté instalado y
  configurado**: TypeScript se queja del módulo virtual sin la referencia de tipos
  (`/// <reference types="vite-plugin-pwa/react" />` o equivalente en `vite-env.d.ts`) —
  agregarla junto con (2).
- **Test de `ActualizacionDisponible` sin Service Worker real**: `useRegisterSW` no funciona en
  jsdom/happy-dom sin un SW real. Mitigación: `vi.mock("virtual:pwa-register/react", …)` con un
  valor de retorno controlado (`needRefresh: [true, fn]`, `updateServiceWorker: vi.fn()`), no
  intentar levantar un Service Worker real en el test.
- **Confirmar que el gateo de `App.tsx` no dispara red**: el test de "con token guardado" debe
  usar el `server` de MSW con `onUnhandledRequest: "error"` (ya configurado en `test-setup.ts`)
  sin agregar ningún handler — si algo hiciera fetch, el test fallaría con el error de MSW, no en
  silencio.
- **Verificación manual del SW real**: no es posible con `vite dev` (Vite no lo activa por
  defecto). Documentado en spec.md como limitación conocida — la verificación manual de este ítem
  se limita a `vite build && vite preview` para confirmar que el SW se registra, sin poder simular
  fácilmente un despliegue de nueva versión en una sola sesión.

## Checkpoints de verificación

- Después de (1): `npm run test --workspace=pmm` corre (aunque sin tests todavía, no debe fallar
  por configuración rota).
- Después de (2): `npm run build --workspace=pmm` genera `dist/sw.js` (o el nombre que
  `vite-plugin-pwa` use por defecto).
- Después de (3): test con `vi.mock` — `needRefresh: true` muestra el aviso y el botón dispara
  `updateServiceWorker`.
- Después de (4): test — sin token muestra `Login`; con token muestra el placeholder sin ninguna
  request de red (MSW sin handlers, `onUnhandledRequest: "error"`).
- Verificación manual: `vite build --workspace=pmm && cd apps/pmm && npx vite preview` — confirmar
  en el navegador que el service worker se registra (DevTools → Application → Service Workers).
