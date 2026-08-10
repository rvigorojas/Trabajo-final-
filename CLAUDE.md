# CLAUDE.md — PCE Jorge Chávez

Contexto persistente para Claude Code en este repo. Se carga completo en cada sesión.

## Qué es este proyecto

PCE (Puesto de Comando y Administración de Emergencias) para el aeropuerto Jorge Chávez.
Backend FastAPI + PostgreSQL 16 implementado y verificado (14/14 tests). Frontend: arrancado
(`frontend/`, monorepo npm workspaces) — ítem #1 del `BACKLOG.md` (Setup compartido) cerrado:
apps `coe`/`pmm` (Vite + React + TypeScript) y paquete `@pce/api-client` (tipos, cliente HTTP,
store de sesión, login compartido), con Tailwind v4 + design tokens de Stitch ("Sentinel
Command") y 9 tests (Vitest + RTL + MSW). Ítem #2 (Shell de navegación COE, Opción 1A) también
cerrado: React Router + Radix Tabs/DropdownMenu, 5 tabs + acciones flotantes gateadas por rol +
menú aparte, 7 tests. Próximo: ítem #3 (Cliente COE — Resumen y Cadena de mando).

**Gotcha de React Router 8 (data router) + jsdom** (encontrado en `verify` del ítem #2): cualquier
`navigate()` con `RouterProvider`/`createMemoryRouter` sobre `jsdom` tira `TypeError: RequestInit:
Expected signal ("AbortSignal {}") to be an instance of AbortSignal` — jsdom instala su propia
clase `AbortSignal` que no es `instanceof` la que espera `undici` al armar el `Request` interno
del data router. Fix: `happy-dom` como entorno de test en vez de `jsdom` para cualquier app que
use `RouterProvider` (ya aplicado en `apps/coe/vitest.config.ts`); `packages/api-client` sigue con
`jsdom` sin problema porque no navega.

**Gotcha de Tailwind v4 + monorepo** (encontrado en `verify`, no obvio): Tailwind no escanea
`node_modules` por default, y `@pce/api-client` vive ahí vía symlink de workspace — sin
`@source "../ruta/al/paquete/src/**/*.{ts,tsx}";` en el `index.css` de cada app, las clases de
cualquier componente compartido se generan en 0 utilidades en el build real, aunque el paquete
compile y testee bien en aislamiento. Ya resuelto en `coe` y `pmm`; tenerlo presente si se agrega
un tercer paquete de UI compartido.

Documentación vigente en `30 07/` (carpeta oficial desde 2026-07-30, reemplaza
`Documentacion 21 07/`): `PRD_PCE_JorgeChavez.3.md`, `Design.md`, `Tech design + ADRs/`
(`TECH-DESIGN.md`, `FRONTEND-SPEC.md`, `FRONTEND-TASKS.md`, `adrs/`).

## Skills instaladas (`skills-lock.json`)

| Skill | Fuente | Cuándo se usa |
|---|---|---|
| `generar-tech-design` | `adminoryslabs/Skills` | Generar el TECH-DESIGN.md + ADRs (formato MADR) entrevistando decisión por decisión a partir del PRD y el Design.md. Ya usada para producir el TDD y los 8 ADRs actuales. |
| `revision-adversarial` | `adminoryslabs/Skills` | Revisar con contexto fresco un TECH-DESIGN.md/ADRs existente, buscando activamente huecos y riesgos en vez de validarlos. Ya usada: encontró y resolvió 4 críticos, 6 advertencias, 2 sugerencias en el TDD actual. Requiere conversación nueva, sin el historial de cómo se llegó a esas decisiones. |
| `spec-driven-development` | `addyosmani/agent-skills` | Escribir spec antes de codear cuando un requisito es ambiguo o no existe todavía (4 fases propias: Specify→Plan→Tasks→Implement, con gate de validación humana entre cada una — no confundir con "gentle-ai" de las infografías del curso, que es solo el nombre narrativo de ejemplo; esta es la misma skill exacta, verificado contra `skills-lock.json` de la carpeta de ejemplo de Clase 8). `BACKLOG.md` (raíz) tiene los 11 ítems del frontend; cada ciclo SDD vive en su propia subcarpeta `tasks/item-NN-<nombre>/` (spec.md+plan.md+todo.md) — ítems #1 y #2 cerrados. Próximo: ítem #3 (Cliente COE — Resumen y Cadena de mando) — nuevo ciclo Specify→Plan→Tasks→Implement en `tasks/item-03-<nombre>/`. |

Instalación: `npx skills add <fuente> --skill <nombre>`. Verificar contra `skills-lock.json`
antes de reinstalar (evita drift de versión).

## Convenciones del backend

- `Activacion` es insert-only (ADR-2): un trigger de DB permite únicamente la transición
  `activa -> cerrada`, verificando que ningún otro campo cambie en el mismo UPDATE.
- Los enums de SQLAlchemy se comparan por su **nombre** (`'ACTIVA'`, mayúsculas), no por
  `.value` — bug real encontrado y corregido el 2026-07-30, ver `bitacora-de-desarrollo.md`.
- Todo cambio de estado queda auditado (`app/db/audit.py`, escucha `after_update`).
- Verificación de migraciones: `alembic upgrade head` / `downgrade -1` / `upgrade head` sin
  error, contra PostgreSQL 16 real, no SQLite.

## Pendientes externos (no bloquean desarrollo)

- Criterio real de convocatoria para emergencias MATPEL (Jefe de Rescate).
- Ventana de 12h del token blando (ADR-7, confirmación de Renzo).
- Mecanismo de sync con token vencido (hueco 6.4 de `FRONTEND-SPEC.md`, confirmación de Renzo).
