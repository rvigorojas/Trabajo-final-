# Backlog: Frontend PMM + COE — PCE Jorge Chávez

Deriva de `21 08/Tech design + ADRs/FRONTEND-SPEC.md` y `FRONTEND-TASKS.md` (Fases 1-4; la Fase 0
de prerrequisitos ya está resuelta — la última pregunta abierta, la del ítem #10 (sync con token
vencido/ventana del token blando), se confirmó con Renzo el 2026-08-12 — y la Fase 5 son pendientes
externos que no bloquean, no un ítem de este backlog).

| # | Item | Alcance | Depende de | Contexto extra requerido |
|---|---|---|---|---|
| 1 | ✅ Setup compartido — **cerrado 2026-08-10** | Estructura `frontend/` (apps `coe`/`pmm` + paquete `@pce/api-client`), tipos TS espejo de los schemas Pydantic, cliente HTTP tipado (auth Bearer, manejo uniforme 401/403/422), store de sesión (decodifica claims del JWT), pantalla de login compartida. Stack: React+Vite+TS, Tailwind v4 + Radix (pendiente de uso real), Vitest+RTL+MSW, npm workspaces. Detalle completo y hallazgos de `verify` en `tasks/todo.md`. (ADR-4) | — | Resuelto: stack confirmado por el usuario, ver `tasks/spec.md`. |
| 2 | ✅ Shell de navegación Cliente COE — **cerrado 2026-08-10** | Opción 1A (tabs inferiores + acciones flotantes Relevo/Desactivar; tabs comprimidas con scroll horizontal en portrait). React Router + Radix Tabs/DropdownMenu, 5 pantallas stub, FloatingActions gateado por rol (roles copiados de `backend/app/deps.py`), MenuAparte para Pre-PAI/Reportes. Detalle y hallazgos de `verify` en `tasks/item-02-shell-navegacion/todo.md`. | #1 | — |
| 3 | ✅ Cliente COE — Resumen y Cadena de mando — **cerrado 2026-08-11** | Alerta activa, cronómetro desde `hora_evento`, convocatoria COE/PMM X/3, evaluación inicial, feed de "últimos eventos" armado client-side (no depende de `LogAuditoria`, sección 6.2), polling 3s. Pestaña Cadena de mando: historial de relevos por `activacion_id`, doble carril COE/PMM. (ADR-5) Detalle y verificación final en `tasks/item-03-resumen-cadena-mando/todo.md`. | #1, #2 | — |
| 4 | ✅ Cliente COE — Mapa y Unidades — **cerrado 2026-08-11** | Mapa de solo lectura: capas Cuadrícula/Incidente/Accesos (Unidades fase 2 deshabilitada), marcadores vía `GET /marcadores-incidente`, cuadrícula lógica sin proveedor real (sin coordenadas georreferenciables todavía). Unidades: `GET /unidades` + `PUT /unidades/{id}` (editable desde COE, confirmado 2026-08-11), polling 3s. (ADR-5, PRD sección 6) Detalle y verificación final en `tasks/item-04-mapa-unidades/todo.md`. | #1, #2 | — |
| 5 | ✅ Cliente COE — Pre-PAI, Reportes y Comunicaciones — **cerrado 2026-08-11** | Pre-PAI: listar + ver detalle (solo lectura, confirmado 2026-08-11 — "activar" con precarga real al formulario de evaluación inicial es el ítem #9, Cliente PMM, que no existe todavía). Reportes: `POST`/`GET /reportes-cierre`, tabla genérica (esquema de columnas real pendiente contra los 4 Excel). Comunicaciones: placeholder sin funcionalidad (confirmado 2026-08-11, sin entidad de datos definida — se define en otro momento). Detalle y verificación final en `tasks/item-05-pre-pai-reportes-comunicaciones/todo.md`. | #1, #2 | — |
| 6 | ✅ Acciones rápidas — Relevo de mando y Desactivar — **cerrado 2026-08-11** | Modal de Relevo (instancia, sale/entra) reutilizable entre COE y PMM, rol restringido a `ROLES_EDICION_EVALUACION_RELEVO`. Desactivar activación, rol restringido a `ROLES_DESACTIVACION`, idempotente. (ADR-2) Detalle y verificación final en `tasks/item-06-relevo-desactivar/todo.md`. | #1, #2 | — |
| 7 | ✅ Cliente PMM — Setup PWA y login offline — **cerrado 2026-08-11** | `vite-plugin-pwa`/Workbox sobre la base de #1. Login que reabre sesión guardada sin llamar al backend si ya había una sesión previa. Aviso de actualización de versión al reconectar, nunca caché vieja en silencio. (ADR-4) Detalle y verificación final en `tasks/item-07-pwa-login-offline/todo.md`. | #1 | — |
| 8 | ✅ Cliente PMM — Nueva activación — **cerrado 2026-08-11** | Selector de categoría (Aeronáutica preseleccionada) → escala dependiente → tipo de incidente → hora auto. `id` (UUID) generado client-side. Payload exacto por categoría (nunca `nivel_alerta`+`clasificacion_origen` juntos fuera de Aeronáutica). Convocatoria MATPEL: siempre "activación general", confirmado con el Jefe de Rescate 2026-08-11 (criterio definitivo, no supuesto). (ADR-6) Detalle y verificación final en `tasks/item-08-nueva-activacion/todo.md`. | #7 | — |
| 9 | ✅ Cliente PMM — Evaluación inicial y Marcador de incidente — **cerrado 2026-08-11** | Evaluación inicial (magnitud, riesgos, rol restringido). Marcador: coordenada de cuadrícula manual (sin geolocalización GETAC en v1), badge "sin sincronizar" del envío en curso (cola offline persistente real es el ítem #10). Primer router de `pmm` (3 pantallas). (ADR-6) Detalle y verificación final en `tasks/item-09-evaluacion-marcador/todo.md`. | #7, #8 | — |
| 10 | ✅ Cliente PMM — Cola offline y token blando — **cerrado 2026-08-13** | Persistencia local (IndexedDB, `offline/db.ts`) de las 4 escrituras offline-capaces (`enviarOEncolar` en Nueva activación, Evaluación inicial, Marcador de incidente, Relevo de mando), reintento al reconectar contra el mismo POST idempotente (ids client-generados). Token blando: sigue encolando con JWT expirado mientras esté offline (`ventanaSesion.ts`, 24h confirmado con Renzo 2026-08-12); al reconectar con JWT vencido, `flushColaOffline()` recibe 401, fuerza logout + vuelta a `Login`, cola intacta, sync automático post-login. Contador "N sin sincronizar" en `Shell`. (ADR-6, ADR-7) Verificado end-to-end contra backend real: cortando y reconectando el servidor y con un JWT vencido firmado a mano, sin duplicados. | #8, #9, #6 | — |
| 11 | ✅ Endurecimiento — **cerrado 2026-08-14** | Walkthrough E2E documentado contra backend real en ambos clientes (COE: Resumen → relevo → Cadena de mando → editar unidad → Pre-PAI; PMM: activación → evaluación → marcador → relevo, caso online). Conteo real de clics desde la pantalla principal: máximo 2 (Pre-PAI/Reportes vía menú aparte de COE), dentro del límite de 3 del PRD sección 7. Auditoría de contraste (WCAG 2.2 AA): todos los pares texto/fondo en uso ≥7.71:1. Auditoría de tap targets: corregidos 6 componentes cuyos `<input>`/`<select>` de formularios operativos no tenían el token de 48px (solo los botones de acción lo tenían). Corte de conectividad real: referenciado del ítem #10, no repetido. Detalle completo en `tasks/item-11-endurecimiento/todo.md`. | #3, #4, #5, #6, #10 | — |

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

**Backlog completo — los 11 ítems cerrados el 2026-08-14.** La Fase 5 de `FRONTEND-TASKS.md`
(pendientes externos) también quedó cerrada: la georreferenciación real del mapa cuadriculado se
resolvió por decisión de Renzo el 2026-08-16 ("Camino 2" — captura por GPS de la tablet GETAC al
registrar un marcador, con input manual de respaldo; ver PRD `.4` y `CLAUDE.md`), y la confirmación
sobre guantes en la tablet (no se usan, el tap target WCAG ya aplicado alcanza) el mismo día. La
matriz real de convocatoria contra GSEG-L-001 y el esquema real de columnas de `ReporteCierre` se
resolvieron el 2026-08-15 (ver `CLAUDE.md`). **No queda ningún pendiente abierto en este backlog
ni en `FRONTEND-TASKS.md`.**
