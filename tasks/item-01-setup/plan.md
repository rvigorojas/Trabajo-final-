# Plan: Ítem #1 del BACKLOG.md — Setup compartido

Insumos: `tasks/spec.md` (validado), `FRONTEND-SPEC.md` sección 1 y 3, `FRONTEND-TASKS.md` Fase 1.

## Componentes y dependencias

1. **Estructura del monorepo** — `frontend/` con npm workspaces: `packages/api-client`,
   `apps/coe`, `apps/pmm`. Sin dependencias previas — es el primer componente.
2. **Paquete `api-client`** — tipos TS espejo de los schemas Pydantic reales
   (`backend/app/schemas/`) + cliente HTTP tipado (fetch wrapper: base URL por entorno, inyección
   de `Authorization: Bearer`, manejo uniforme de 401/403/422). Depende de (1).
3. **Store de sesión** — decodifica claims del JWT (`sub`, `rol`, `instancia_principal`),
   persistencia local (localStorage), logout. Vive en `api-client` (compartido entre ambas apps,
   `FRONTEND-SPEC.md` sección 3). Depende de (2).
4. **Pantalla de login compartida** — mismo componente para `apps/coe` y `apps/pmm` (Opción 1F del
   pptx, "el rol define permisos, no la pantalla"). Depende de (2), (3).
5. **Config de Tailwind + tokens** — `tailwind.config` con los tokens del design system Stitch
   ("Sentinel Command": colores por nivel de alerta, tipografía Inter/JetBrains Mono, spacing base
   8px, touch-target-min 48px, roundness). Depende de (1), no bloquea 2-4 (puede ir en paralelo).

## Orden de implementación

(1) → (2) → (3) → (4), con (5) en paralelo a partir de (1). No hay nada que deba ir después de
(4) dentro de este ítem — el shell de navegación (ítem #2 del backlog) es lo siguiente, fuera de
este plan.

## Riesgos y mitigación

- **Drift entre tipos TS y schemas Pydantic reales**: `FRONTEND-SPEC.md` ya advierte que se
  mantienen sincronizados a mano "hasta que se automatice (ej. `openapi-typescript` contra `/docs`
  del backend)". Mitigación para este ítem: escribir los tipos a mano leyendo directamente
  `backend/app/schemas/*.py`, no inventarlos — y dejar anotado en el propio archivo de tipos que
  automatizarlo es una mejora futura, no bloqueante.
- **Backend no corrible en este entorno** (sin Docker, ver sesión de refactor de hoy): el cliente
  HTTP se puede escribir y testear con mocks/MSW sin necesitar el backend real levantado; la
  verificación end-to-end contra el backend real queda para cuando haya un entorno con Docker
  disponible (ítem #11 del backlog, Endurecimiento).

## Checkpoints de verificación

- Después de (1): `npm install` en la raíz de `frontend/` corre sin error, ambos workspaces
  reconocidos (`npm ls --workspaces`).
- Después de (2): tipos compilan (`tsc --noEmit`) contra al menos los schemas de `Activacion` y
  `Usuario` (los dos que ya usa el login/sesión).
- Después de (3)-(4): login renderiza y decodifica un JWT de prueba (fixture, no llamada real al
  backend) sin errores en consola.
