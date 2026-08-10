# Spec: Shell de navegación Cliente COE — Opción 1A (ítem #2 del BACKLOG.md)

Complemento de `30 07/Tech design + ADRs/FRONTEND-SPEC.md` sección 4 (pantallas del COE, agnóstico
al shell) y `FRONTEND-TASKS.md` Fase 2. Este archivo cubre solo el shell de navegación en sí — el
contenido real de cada pantalla es de los ítems #3-#6 del backlog, no de este.

## Decisiones confirmadas (2026-08-10)

1. **Routing:** React Router. Cada tab es una URL real (`/resumen`, `/mapa`, `/unidades`,
   `/comunicaciones`, `/cadena-de-mando`), más `/pre-pai` y `/reportes` fuera de la barra de tabs.
   Permite deep-link, botón atrás del navegador, y verificar el límite de 3 clics del PRD
   (sección 7) contando saltos de URL en vez de inferirlo de un estado interno.
2. **Acciones flotantes sin rol habilitado:** se ocultan por completo (no se muestran
   deshabilitadas). Coincide con el boundary ya escrito en `tasks/item-01-setup/spec.md`.

Todas las demás open questions heredadas de `tasks/item-01-setup/spec.md` (code style, cobertura
de tests, Comunicaciones, edición de unidad desde COE, token vencido, convocatoria MATPEL) siguen
abiertas y no bloquean este ítem — el shell no toca ninguna de ellas.

## Objective

Dar al Cliente COE (`frontend/apps/coe`) una navegación real después del login: barra de tabs fija
abajo con las 5 pantallas principales, dos acciones flotantes siempre visibles (Relevo de mando,
Desactivar) restringidas por rol, y un punto de acceso aparte para Pre-PAI y Reportes (no son tabs
principales — `Design.md` Flujo B, Hueco 2). Este ítem construye el andamiaje de navegación y
pantallas *stub* (una por ruta, con el título y nada más); el contenido real de cada pantalla es de
los ítems #3-#6.

Fuente de la variante elegida: `Tablet_app_structures.pptx`, Opción 1A (decidida por Renzo
2026-07-30, `FRONTEND-TASKS.md` Fase 0): tabs inferiores fijas; Relevo de mando y Desactivar como
botones flotantes siempre a mano; en portrait la barra de tabs se comprime con scroll horizontal.

**Éxito:** desde el login, un usuario con rol de Coordinador ve las 5 tabs + 2 acciones flotantes;
un usuario sin esos roles ve las 5 tabs sin las acciones flotantes; navegar a cualquier pantalla
principal toma 1 clic desde cualquier otra (barra de tabs siempre visible).

## Tech Stack

- React Router (`react-router` v7 — última estable, no `react-router-dom` legacy) para rutas
  declarativas dentro de `apps/coe`.
- Radix UI `Tabs` (primitive headless, ya decidido en `tasks/item-01-setup/spec.md` pero sin uso
  real todavía — este es su primer consumo) para la barra de tabs, con estilos Tailwind /
  design tokens "Sentinel Command" ya configurados en `apps/coe`.
- `getClaims()` de `@pce/api-client` (ya existe, `packages/api-client/src/session.ts`) para leer
  `rol` del JWT decodificado y decidir qué acciones flotantes mostrar.

## Commands

Mismos del monorepo, alcance `coe`:

```
Dev:   npm run dev --workspace=coe
Build: npm run build --workspace=coe
Test:  npm run test --workspace=coe
Lint:  npm run lint --workspace=coe
```

## Project Structure

Nuevo dentro de `frontend/apps/coe/src/`:

```
src/
  App.tsx                 → gate de sesión (ya existe: muestra <Login> si no hay token) +
                             <RouterProvider> si hay sesión
  router.tsx               → definición de rutas (createBrowserRouter)
  shell/
    Shell.tsx               → layout: <Outlet/> + TabBar + acciones flotantes
    TabBar.tsx               → Radix Tabs, 5 tabs principales, compresión con scroll horizontal
    FloatingActions.tsx      → botones Relevo/Desactivar, gateados por rol vía getClaims()
    MenuAparte.tsx            → acceso a Pre-PAI/Reportes, fuera de la barra de tabs
  screens/
    ResumenScreen.tsx         → stub (ítem #3)
    MapaScreen.tsx            → stub (ítem #4)
    UnidadesScreen.tsx        → stub (ítem #4)
    ComunicacionesScreen.tsx  → stub (ítem #5)
    CadenaDeMandoScreen.tsx   → stub (ítem #3)
    PrePAIScreen.tsx          → stub (ítem #5)
    ReportesScreen.tsx        → stub (ítem #5)
```

Cada `*Screen.tsx` stub renderiza solo un título (`<h1>Resumen</h1>`, etc.) — evita que este ítem
se filtre al alcance de los ítems #3-#6.

## Code Style

Sigue el estilo ya establecido en `packages/api-client/src/components/Login.tsx` (único componente
React existente hoy): componentes función con `export function NombreComponente(...)`, props
tipadas con `interface NombrePropsProps`, sin `React.FC`. Comentarios solo donde el código no
explique el porqué (ver ejemplo real en `packages/api-client/src/index.ts:1-4`).

## Testing Strategy

- Vitest + React Testing Library (ya configurado en `apps/coe`, ver `tasks/item-01-setup/spec.md`).
- `TabBar`: render con cada rol de ejemplo, click de tab cambia la ruta activa (usar
  `MemoryRouter`/`createMemoryRouter` de `react-router` para tests, no `BrowserRouter`).
- `FloatingActions`: con rol en `ROLES_DESACTIVACION` (ej. `duty_manager`) ambos botones visibles;
  con un rol fuera de ambas listas (ej. `bombero` — verificar nombre exacto contra
  `backend/app/models/usuario.py::Rol`) ningún botón visible.
- No se testea contenido de pantallas (son stubs) — eso es testing strategy de los ítems #3-#6.

## Boundaries

- **Always:** los roles que gatean `FloatingActions` deben copiarse literal de
  `backend/app/deps.py` (`ROLES_EDICION_EVALUACION_RELEVO`, `ROLES_DESACTIVACION`) — no inventar
  una lista aparte que pueda divergir del backend real.
- **Ask first:** extraer `Shell`/`TabBar` a un paquete compartido (`packages/ui` o similar) para
  reusarlo en `apps/pmm` — el shell de PMM (ítem #7) es offline-first y puede tener requisitos de
  navegación distintos; prematuro compartir código antes de conocerlos.
- **Never:** construir contenido real de Resumen/Mapa/Unidades/Comunicaciones/Cadena de
  mando/Pre-PAI/Reportes en este ítem — son los ítems #3-#6 del backlog, con sus propios ciclos SDD.

## Success Criteria

- Con sesión iniciada, las 5 tabs (Resumen, Mapa, Unidades, Comunicaciones, Cadena de mando) están
  visibles y navegables con 1 clic cada una, en una URL propia.
- Pre-PAI y Reportes accesibles desde el menú aparte (no ocupan un slot de la barra de tabs).
- Con un rol en `ROLES_DESACTIVACION` o `ROLES_EDICION_EVALUACION_RELEVO`, el botón flotante
  correspondiente aparece; sin ese rol, no aparece — verificado con al menos un rol de cada lado.
- En viewport angosto (portrait, simulado en el test o devtools), la barra de tabs se comprime con
  scroll horizontal sin recortar ninguna tab.
- `npm run test --workspace=coe` y `npm run build --workspace=coe` pasan limpios.

## Open Questions

Ninguna nueva para este ítem — las 2 bifurcaciones reales (routing, comportamiento de acciones sin
rol) ya se confirmaron arriba. Heredadas de `tasks/item-01-setup/spec.md` (no bloquean este ítem):
mecanismo de sync con token vencido, alcance de Comunicaciones, edición de unidad desde COE,
convocatoria MATPEL, code style/cobertura formales, criterio real de convocatoria MATPEL.
