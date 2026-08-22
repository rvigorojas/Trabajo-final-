# Spec: Frontend PMM + COE (fase Specify de `spec-driven-development`)

Complemento de `21 08/Tech design + ADRs/FRONTEND-SPEC.md` (296 líneas, ya cubre objetivo, contrato
de API, pantallas y huecos) y `FRONTEND-TASKS.md` (ya desglosado en 5 fases). Este archivo llena
solo las secciones del template de la skill que esos documentos no cubren — no los repite.

## Decisiones confirmadas (2026-08-10, "procede" sobre las asunciones planteadas)

1. Monorepo: `frontend/` como sibling de `backend/` en el mismo repo — confirmado.
2. React + Vite + TypeScript — confirmado.
3. Gestor de paquetes: npm — confirmado.
4. Node LTS vigente al crear el proyecto — confirmado.
5. Testing: Vitest + React Testing Library — confirmado.
6. Framework de UI/componentes: **Tailwind CSS + Radix UI (primitives headless)**. Justificación: el
   sistema de diseño "Sentinel Command" (Stitch, `assets/16f5e680539043ecade07f8a699daa0b`) ya define
   sus propios tokens completos (colores tácticos por nivel de alerta, tipografía Inter/JetBrains
   Mono, radios, espaciado de 8px, touch targets de 48px) — Tailwind los mapea 1:1 vía
   `tailwind.config` sin theme preexistente que pelee contra eso. Radix aporta accesibilidad real
   (foco, teclado, ARIA) en tabs/modales/selects sin imponer estilo visual propio, a diferencia de
   MUI/Chakra. Esta decisión reemplaza al "**open question**" que tenía este archivo antes — no es
   una asunción silenciosa, quedó planteada explícitamente y confirmada por el usuario.

Todas las demás **Open Questions** de este archivo (code style, cobertura mínima de tests) y las
heredadas de `FRONTEND-TASKS.md` (Comunicaciones, edición de unidad desde COE, token vencido,
convocatoria MATPEL) siguen abiertas — no bloquean el ítem #1 del backlog (Setup compartido), que
no las toca.

## Objective

Ver `FRONTEND-SPEC.md` sección 0 y `PRD_PCE_JorgeChavez.3.md`. Resumen: dos clientes (COE
online, PMM offline-first PWA) que consumen el backend FastAPI ya implementado y verificado.

## Tech Stack

- React + Vite (ADR-4) + TypeScript.
- Tailwind CSS + Radix UI (primitives) — ver justificación en "Decisiones confirmadas" arriba.
- `vite-plugin-pwa` + Workbox para el cliente PMM (ADR-4, `FRONTEND-SPEC.md` sección 5).
- Vitest + React Testing Library para tests unitarios.
- Cliente HTTP tipado compartido (`FRONTEND-SPEC.md` sección 1, paquete `api-client`).
- npm workspaces para el monorepo (`frontend/apps/coe`, `frontend/apps/pmm`, `frontend/packages/api-client`).

## Commands

Se fijan al crear el `package.json` raíz de `frontend/` con npm workspaces (ítem #1 del backlog):

```
Build: npm run build --workspace=<app>
Test:  npm run test --workspace=<app>
Lint:  npm run lint --workspace=<app>
Dev:   npm run dev --workspace=<app>
```

## Project Structure

Ver `FRONTEND-SPEC.md` sección 1 (`frontend/packages/api-client`, `frontend/apps/coe`,
`frontend/apps/pmm`) — ya está especificada ahí, no se repite acá.

## Code Style

No hay ejemplo de código ni convención fijada todavía (el frontend no tiene una sola línea
escrita). **Open question**, no una asunción — no voy a inventar una convención de estilo sin que
el equipo la valide, a diferencia de la estructura de carpetas que sí viene de `FRONTEND-SPEC.md`.

## Testing Strategy

- `FRONTEND-TASKS.md` Fase 4 ya pide "al menos un flujo end-to-end por cliente... contra el
  backend real, no mocks" — coherente con cómo se verificó el backend (Postgres real, no SQLite).
- Framework unitario: sin decidir (asunción 5 arriba).
- Cobertura mínima: no definida en ningún documento — **open question**.

## Boundaries

- **Always:** seguir el contrato de API tal como está documentado en `FRONTEND-SPEC.md` sección 2
  (no inventar campos ni asumir endpoints que no existen — ej. no crear un "endpoint de vínculo
  Pre-PAI↔Activación", sección 4 ya aclara que es lógica puramente frontend); ocultar/deshabilitar
  en UI las acciones restringidas por rol aunque el backend ya las rechace con 403/422.
- **Ask first:** cualquier cambio al contrato del backend (`app/schemas`, `app/routers`) que el
  frontend "necesite" — el backend ya está verificado y congelado salvo bugs reales; agregar
  endpoints nuevos (ej. de auditoría, sección 6.2) requiere decisión explícita, no default.
- **Never:** implementar georreferenciación real de mapa o integrar un proveedor tipo
  Leaflet/OSM (PRD sección 8, riesgo técnico abierto — no hay coordenadas reales todavía);
  construir el exportador de `ReporteCierre` asumiendo columnas específicas por categoría antes de
  cerrar el esquema contra los 4 Excel reales (`FRONTEND-SPEC.md` sección 4, "Reportes").

## Success Criteria

Heredados de `FRONTEND-TASKS.md` Fase 4 (ya son testables):
- Flujo end-to-end completo por cliente (activación → evaluación → relevo → cierre) contra backend
  real, sin duplicados.
- Límite de 3 clics del PRD (sección 7) verificado manualmente en ambos clientes con el shell 1A.
- Prueba real de corte de conectividad en el cliente PMM: completar los 4 flujos offline,
  reconectar, confirmar sync sin duplicados (no solo simulado en devtools).

## Open Questions

Las mismas 3 ya listadas en `FRONTEND-TASKS.md` Fase 0 y Fase 5 (no las repito en detalle, ver ahí)
más 3 nuevas que salen de completar este template:

1. Framework de UI/componentes (Tailwind + headless, MUI, Chakra, u otro) — sin decidir en ningún
   documento previo.
2. Convención de code style (formateo, naming) — sin decidir, el frontend no tiene código todavía.
3. Framework de testing unitario y cobertura mínima esperada — sin decidir.
4. *(Heredada)* Mecanismo de sync con token vencido (hueco 6.4).
5. *(Heredada)* Alcance real de "Comunicaciones" — sin entidad de datos definida.
6. *(Heredada)* Si el COE puede editar estado de unidad o es solo lectura desde su pantalla.
