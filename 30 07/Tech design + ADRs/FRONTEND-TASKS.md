# Tareas — Frontend PMM + COE

Desglose de implementación derivado de `FRONTEND-SPEC.md`. Cada fase asume que las anteriores están
cerradas. Los ítems marcados **[bloqueado]** dependen de una decisión externa (Renzo / Jefe de
Rescate) o de un hueco de backend (`FRONTEND-SPEC.md`, sección 6) — no empezarlos antes de tiempo.

## Fase 0 — Prerrequisitos antes de escribir código de UI

- [x] Elegir la variante de navegación final entre 1A-1E de
      `Tablet_app_structures.pptx`. **Decidido 2026-07-30 (Renzo): Opción 1A — tabs inferiores +
      acciones flotantes** (Relevo/Desactivar siempre a mano; en portrait la barra de tabs se
      comprime con scroll horizontal).
- [x] Arreglar hueco 6.1: migración Alembic que agrega `activacion_id` a `RelevoMando` + filtro por
      query param en `GET /relevos-mando`. **Hecho 2026-07-30** (migración
      `0003_relevo_activacion_y_cierre`, verificado contra Postgres real).
- [x] Arreglar hueco 6.3: agregar endpoint para cerrar una activación (`POST
      /activaciones/{id}/desactivar`) que cambie `estado` a `cerrada`. **Hecho 2026-07-30**, con su
      propio trigger de DB (única transición de UPDATE permitida sobre `Activacion`) y auditoría.
- [ ] Decidir con Renzo el mecanismo del hueco 6.4 (sync con token vencido): ¿refresh silencioso al
      detectar señal antes de reenviar la cola, o el backend acepta token vencido si el payload trae
      `hora_evento` dentro de la ventana de sesión offline?
- [ ] Confirmar alcance real de "Comunicaciones" (sin entidad de datos definida hoy).
- [ ] Confirmar si el COE puede editar estado de unidad o es solo lectura desde su pantalla.

## Fase 1 — Setup compartido

- [ ] Crear `frontend/` (estructura propuesta en `FRONTEND-SPEC.md` sección 1, o la que el equipo
      prefiera) con dos apps Vite + React (`apps/coe`, `apps/pmm`).
- [ ] Paquete/carpeta compartida de tipos TS que reflejen los schemas Pydantic reales (`Activacion`,
      `ConvocatoriaMiembro`, `EvaluacionInicial`, `RelevoMando`, `Unidad`, `MarcadorIncidente`,
      `PrePAI`, `ReporteCierre`, `Usuario`) — mantener sincronizados a mano con `backend/app/schemas/`
      hasta que se automatice (ej. `openapi-typescript` contra `/docs` del backend).
- [ ] Cliente HTTP tipado compartido: base URL configurable por entorno, inyección de
      `Authorization: Bearer`, manejo uniforme de 401/403/422.
- [ ] Store de sesión compartido: decodificar claims del JWT (`sub`, `rol`, `instancia_principal`),
      persistencia local, logout.
- [ ] Pantalla de login compartida (Opción 1F del pptx) — mismo componente para ambas apps.

## Fase 2 — Cliente COE

- [ ] Shell de navegación: Opción **1A** (tabs inferiores + acciones flotantes para Relevo y
      Desactivar), con la barra de tabs comprimida con scroll horizontal en portrait.
- [ ] Pantalla Resumen: alerta activa, cronómetro, convocatoria COE/PMM X/3, evaluación inicial,
      feed de "últimos eventos" construido client-side (sección 4 de `FRONTEND-SPEC.md`, no depende
      de `LogAuditoria`). Polling 3s (ADR-5).
- [ ] Pantalla Mapa (solo lectura): capas Cuadrícula/Incidente/Accesos, marcadores vía `GET
      /marcadores-incidente`. Sin proveedor de mapas real todavía — cuadrícula lógica únicamente.
- [ ] Pantalla Unidades: `GET /unidades`, polling 3s.
- [ ] Pantalla Comunicaciones — placeholder hasta resolver Fase 0.
- [ ] Pestaña Cadena de mando: `GET /relevos-mando?activacion_id=` (filtro ya disponible), doble
      carril COE/PMM por `instancia`.
- [ ] Menú aparte: Pre-PAI (listar + "activar" precargando campos en el formulario de evaluación
      inicial) y Reportes (`POST`/`GET /reportes-cierre`, tabla genérica).
- [ ] Acción rápida Relevo de mando (modal, 1 clic, rol restringido).
- [ ] Acción Desactivar (`POST /activaciones/{id}/desactivar`, ya disponible, rol restringido a
      Gerente de Seguridad/Gerente de Operaciones/Duty Manager — no el CI).
- [ ] Recorrido de validación de 3 clics: medir cuántos toques reales hacen falta para llegar a cada
      función crítica desde la pantalla principal, contra el criterio del PRD (sección 7).

## Fase 3 — Cliente PMM

- [ ] Setup PWA (`vite-plugin-pwa`, Workbox) sobre la misma base de Fase 1.
- [ ] Login offline-capable: reabrir sesión guardada sin llamar al backend si ya había sesión previa.
- [ ] Pantalla Nueva activación: selector de categoría → escala dependiente → tipo de incidente →
      hora auto, con el armado de payload exacto por categoría (`FRONTEND-SPEC.md` sección 2).
      Generar `id` (UUID) client-side.
- [ ] Pantalla Evaluación inicial (rol restringido, encolable offline).
- [ ] Pantalla Marcador de incidente: input de coordenada de cuadrícula, badge "sin sincronizar"
      calculado client-side (no viene del backend).
- [ ] Relevo de mando (mismo componente que COE, reutilizado).
- [ ] Cola offline (IndexedDB): persistir escrituras encoladas de las 4 acciones críticas
      (activación, evaluación inicial, relevo, marcador), reintento automático al reconectar contra
      el mismo endpoint POST (idempotente por `id`, ADR-6).
- [ ] Lógica de "token blando": seguir encolando con token expirado mientras esté offline; al
      reconectar, aplicar lo que se haya decidido en Fase 0 para el hueco 6.4.
- [ ] Ventana máxima de sesión offline `[Propuesto: 12h]` — exigir relogin para *nuevas* acciones si
      se supera, sin descartar lo ya encolado.
- [ ] Aviso de actualización de versión PWA al reconectar (ADR-4) — nunca servir caché vieja en
      silencio.

## Fase 4 — Endurecimiento

- [ ] Tests de integración mínimos: al menos un flujo end-to-end por cliente (activación → evaluación
      → relevo → cierre) contra el backend real, no mocks — mismo criterio ya usado para verificar
      el backend contra PostgreSQL real en vez de una base simulada.
- [ ] Verificación manual del límite de 3 clics en ambos clientes, con el shell de navegación 1A.
- [ ] Accesibilidad básica: contraste, tamaño de tap targets (tablet GETAC usada con guantes en
      algunos escenarios — no confirmado en el PRD, validar con Renzo si aplica).
- [ ] Prueba de pérdida de conectividad real en el Cliente PMM (no solo simulada en devtools): cortar
      red, completar los 4 flujos offline, reconectar, confirmar sincronización sin duplicados.

## Fase 5 — Pendientes externos (no bloquean el desarrollo, sí el cierre del proyecto)

- [ ] Respuesta del Jefe de Rescate: criterio real de convocatoria para MATPEL (hoy fijo en
      "activación general").
- [ ] Confirmación de Renzo: ventana de 12h del token blando.
- [ ] Confirmación de Renzo: mecanismo de sync con token vencido (hueco 6.4).
- [ ] Levantamiento/georreferenciación real del mapa cuadriculado (prerrequisito externo al
      software, TECH-DESIGN.md § Riesgos técnicos abiertos).
- [x] Matriz real de convocatoria (`rol_convocatoria`) contra GSEG-L-001 — **resuelto 2026-08-15**:
      sembrada con la lista real de § 4.2.2 para Aeronáutica (única categoría que el plan detalla);
      extendida a las otras 3 categorías por decisión de Renzo, ya que el plan no define una matriz
      propia para ellas — supuesto explícito, a confirmar con el Jefe de Rescate si cambia. Ver
      `backend/app/services/seed.py`.
- [ ] Esquema real de columnas de `ReporteCierre` por categoría, contra los 4 Excel actuales.
