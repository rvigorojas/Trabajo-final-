# Backlog: Frontend PMM + COE — PCE Jorge Chávez

Deriva de `30 07/Tech design + ADRs/FRONTEND-SPEC.md` y `FRONTEND-TASKS.md` (Fases 1-4; la Fase 0
de prerrequisitos ya está resuelta salvo las 3 preguntas listadas como contexto extra abajo, y la
Fase 5 son pendientes externos que no bloquean, no un ítem de este backlog).

| # | Item | Alcance | Depende de | Contexto extra requerido |
|---|---|---|---|---|
| 1 | ✅ Setup compartido — **cerrado 2026-08-10** | Estructura `frontend/` (apps `coe`/`pmm` + paquete `@pce/api-client`), tipos TS espejo de los schemas Pydantic, cliente HTTP tipado (auth Bearer, manejo uniforme 401/403/422), store de sesión (decodifica claims del JWT), pantalla de login compartida. Stack: React+Vite+TS, Tailwind v4 + Radix (pendiente de uso real), Vitest+RTL+MSW, npm workspaces. Detalle completo y hallazgos de `verify` en `tasks/todo.md`. (ADR-4) | — | Resuelto: stack confirmado por el usuario, ver `tasks/spec.md`. |
| 2 | ✅ Shell de navegación Cliente COE — **cerrado 2026-08-10** | Opción 1A (tabs inferiores + acciones flotantes Relevo/Desactivar; tabs comprimidas con scroll horizontal en portrait). React Router + Radix Tabs/DropdownMenu, 5 pantallas stub, FloatingActions gateado por rol (roles copiados de `backend/app/deps.py`), MenuAparte para Pre-PAI/Reportes. Detalle y hallazgos de `verify` en `tasks/item-02-shell-navegacion/todo.md`. | #1 | — |
| 3 | ✅ Cliente COE — Resumen y Cadena de mando — **cerrado 2026-08-11** | Alerta activa, cronómetro desde `hora_evento`, convocatoria COE/PMM X/3, evaluación inicial, feed de "últimos eventos" armado client-side (no depende de `LogAuditoria`, sección 6.2), polling 3s. Pestaña Cadena de mando: historial de relevos por `activacion_id`, doble carril COE/PMM. (ADR-5) Detalle y verificación final en `tasks/item-03-resumen-cadena-mando/todo.md`. | #1, #2 | — |
| 4 | ✅ Cliente COE — Mapa y Unidades — **cerrado 2026-08-11** | Mapa de solo lectura: capas Cuadrícula/Incidente/Accesos (Unidades fase 2 deshabilitada), marcadores vía `GET /marcadores-incidente`, cuadrícula lógica sin proveedor real (sin coordenadas georreferenciables todavía). Unidades: `GET /unidades` + `PUT /unidades/{id}` (editable desde COE, confirmado 2026-08-11), polling 3s. (ADR-5, PRD sección 6) Detalle y verificación final en `tasks/item-04-mapa-unidades/todo.md`. | #1, #2 | — |
| 5 | ✅ Cliente COE — Pre-PAI, Reportes y Comunicaciones — **cerrado 2026-08-11** | Pre-PAI: listar + ver detalle (solo lectura, confirmado 2026-08-11 — "activar" con precarga real al formulario de evaluación inicial es el ítem #9, Cliente PMM, que no existe todavía). Reportes: `POST`/`GET /reportes-cierre`, tabla genérica (esquema de columnas real pendiente contra los 4 Excel). Comunicaciones: placeholder sin funcionalidad (confirmado 2026-08-11, sin entidad de datos definida — se define en otro momento). Detalle y verificación final en `tasks/item-05-pre-pai-reportes-comunicaciones/todo.md`. | #1, #2 | — |
| 6 | Acciones rápidas — Relevo de mando y Desactivar | Modal de Relevo (instancia, sale/entra) reutilizable entre COE y PMM, rol restringido a `ROLES_EDICION_EVALUACION_RELEVO`. Desactivar activación, rol restringido a `ROLES_DESACTIVACION`, idempotente. (ADR-2) | #1, #2 | — |
| 7 | Cliente PMM — Setup PWA y login offline | `vite-plugin-pwa`/Workbox sobre la base de #1. Login que reabre sesión guardada sin llamar al backend si ya había una sesión previa. Aviso de actualización de versión al reconectar, nunca caché vieja en silencio. (ADR-4) | #1 | — |
| 8 | Cliente PMM — Nueva activación | Selector de categoría (Aeronáutica preseleccionada) → escala dependiente → tipo de incidente → hora auto. `id` (UUID) generado client-side. Payload exacto por categoría (nunca `nivel_alerta`+`clasificacion_origen` juntos fuera de Aeronáutica). (ADR-6) | #7 | Criterio real de convocatoria MATPEL (hoy fijo en "activación general", Jefe de Rescate sin confirmar). |
| 9 | Cliente PMM — Evaluación inicial y Marcador de incidente | Evaluación inicial (magnitud, riesgos, rol restringido, encolable offline). Marcador: coordenada de cuadrícula manual (sin geolocalización GETAC en v1), badge "sin sincronizar" calculado client-side (el backend siempre devuelve `estado_sincronizado: true`). (ADR-6) | #7, #8 | — |
| 10 | Cliente PMM — Cola offline y token blando | Persistencia local (IndexedDB) de las 4 escrituras offline-capaces, reintento al reconectar contra el mismo POST idempotente. Token blando: seguir encolando con JWT expirado mientras esté offline. Ventana máxima de sesión offline. (ADR-6, ADR-7) | #8, #9, #6 | Mecanismo de sync con token vencido (hueco 6.4) y ventana de 12h — ambos `[Propuesto]`, sin confirmar con Renzo. |
| 11 | Endurecimiento | Al menos un flujo end-to-end por cliente contra backend real (no mocks). Verificación manual del límite de 3 clics (PRD sección 7) con el shell 1A. Accesibilidad básica (contraste, tap targets para uso con guantes). Prueba real de corte de conectividad en el Cliente PMM (no solo simulada), confirmando sync sin duplicados. | #3, #4, #5, #6, #10 | — |

## Cómo usar este backlog

Cada ítem es una spec independiente. Al implementarlo, arrancá un ciclo de Spec-Driven
Development (skill `spec-driven-development`, ya instalada — ver `skills-lock.json` y
`CLAUDE.md`) usando ese ítem como el "change", no el frontend completo. `FRONTEND-SPEC.md` y
`FRONTEND-TASKS.md` ya tienen el detalle de contrato de API y desglose técnico de cada ítem — la
fase Specify de cada ciclo debe partir de ahí, no reinventarlo, y completar solo lo que ese
documento no cubre (Tech Stack, Commands, Code Style, Testing Strategy, Boundaries — ver
`tasks/spec.md`, que ya arrancó ese trabajo para el ítem #1).

Si la columna "Contexto extra requerido" tiene algo, es una pregunta abierta real (no una
asunción mía) — confirmarla con Renzo antes de cerrar la spec de ese ítem, o marcar el ítem como
bloqueado si la respuesta cambia su alcance.

Orden sugerido por dependencias: 1 → 2 → (3, 4, 5, 6 en paralelo) → 7 → 8 → 9 → 10 → 11. El
ítem 1 es el único prerrequisito duro de todo lo demás.
