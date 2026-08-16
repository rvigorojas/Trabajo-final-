# Tareas — Frontend PMM + COE

Desglose de implementación derivado de `FRONTEND-SPEC.md`. Cada fase asume que las anteriores están
cerradas. Los ítems marcados **[bloqueado]** dependen de una decisión externa (Renzo / Jefe de
Rescate) o de un hueco de backend (`FRONTEND-SPEC.md`, sección 6) — no empezarlos antes de tiempo.

**Nota 2026-08-16**: las Fases 0-4 quedaron completas (backlog cerrado 2026-08-14, ver
`BACKLOG.md` y `CLAUDE.md`); esta sección no se había actualizado y quedó desfasada — los
checkboxes de abajo se marcan ahora para reflejar el estado real. El detalle de implementación y
verificación de cada ítem vive en `tasks/item-NN-<nombre>/todo.md` (raíz del repo), no acá.

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
- [x] Decidir con Renzo el mecanismo del hueco 6.4 (sync con token vencido). **Confirmado
      2026-08-12**: re-login forzado al reconectar con JWT vencido, cola offline intacta, sync
      automático post-login, sin endpoint especial de backend.
- [x] Confirmar alcance real de "Comunicaciones". **Confirmado 2026-08-11**: placeholder sin
      funcionalidad, sin entidad de datos definida.
- [x] Confirmar si el COE puede editar estado de unidad o es solo lectura desde su pantalla.
      **Confirmado 2026-08-11**: editable desde COE, sin restricción de rol adicional.

## Fase 1 — Setup compartido

- [x] Crear `frontend/` (estructura propuesta en `FRONTEND-SPEC.md` sección 1) con dos apps Vite +
      React (`apps/coe`, `apps/pmm`). **Cerrado 2026-08-10**, ítem #1 de `BACKLOG.md`.
- [x] Paquete/carpeta compartida de tipos TS que reflejen los schemas Pydantic reales (`Activacion`,
      `ConvocatoriaMiembro`, `EvaluacionInicial`, `RelevoMando`, `Unidad`, `MarcadorIncidente`,
      `PrePAI`, `ReporteCierre`, `Usuario`). **Cerrado 2026-08-10** (`@pce/api-client`).
- [x] Cliente HTTP tipado compartido: base URL configurable por entorno, inyección de
      `Authorization: Bearer`, manejo uniforme de 401/403/422. **Cerrado 2026-08-10**.
- [x] Store de sesión compartido: decodificar claims del JWT (`sub`, `rol`, `instancia_principal`),
      persistencia local, logout. **Cerrado 2026-08-10**.
- [x] Pantalla de login compartida (Opción 1F del pptx) — mismo componente para ambas apps.
      **Cerrado 2026-08-10**.

## Fase 2 — Cliente COE

- [x] Shell de navegación: Opción **1A** (tabs inferiores + acciones flotantes para Relevo y
      Desactivar), con la barra de tabs comprimida con scroll horizontal en portrait. **Cerrado
      2026-08-10**, ítem #2 de `BACKLOG.md`.
- [x] Pantalla Resumen: alerta activa, cronómetro, convocatoria COE/PMM X/3, evaluación inicial,
      feed de "últimos eventos" construido client-side (sección 4 de `FRONTEND-SPEC.md`, no depende
      de `LogAuditoria`). Polling 3s (ADR-5). **Cerrado 2026-08-11**, ítem #3.
- [x] Pantalla Mapa (solo lectura): capas Cuadrícula/Incidente/Accesos, marcadores vía `GET
      /marcadores-incidente`. **Cerrado 2026-08-11**, ítem #4 (workaround de georreferenciación
      parcial agregado 2026-08-15, ver Fase 5).
- [x] Pantalla Unidades: `GET /unidades`, polling 3s. **Cerrado 2026-08-11**, ítem #4.
- [x] Pantalla Comunicaciones — placeholder. **Cerrado 2026-08-11**, ítem #5.
- [x] Pestaña Cadena de mando: `GET /relevos-mando?activacion_id=` (filtro ya disponible), doble
      carril COE/PMM por `instancia`. **Cerrado 2026-08-11**, ítem #3.
- [x] Menú aparte: Pre-PAI (listar + "activar" precargando campos en el formulario de evaluación
      inicial) y Reportes (`POST`/`GET /reportes-cierre`, tabla genérica). **Cerrado 2026-08-11**,
      ítem #5 ("activar" con precarga real quedó para el ítem #9).
- [x] Acción rápida Relevo de mando (modal, 1 clic, rol restringido). **Cerrado 2026-08-11**, ítem
      #6.
- [x] Acción Desactivar (`POST /activaciones/{id}/desactivar`, rol restringido a Gerente de
      Seguridad/Gerente de Operaciones/Duty Manager). **Cerrado 2026-08-11**, ítem #6.
- [x] Recorrido de validación de 3 clics: medir cuántos toques reales hacen falta para llegar a cada
      función crítica desde la pantalla principal, contra el criterio del PRD (sección 7).
      **Cerrado 2026-08-14** (ítem #11): máximo 2 clics reales, dentro del límite de 3.

## Fase 3 — Cliente PMM

- [x] Setup PWA (`vite-plugin-pwa`, Workbox) sobre la misma base de Fase 1. **Cerrado 2026-08-11**,
      ítem #7.
- [x] Login offline-capable: reabrir sesión guardada sin llamar al backend si ya había sesión
      previa. **Cerrado 2026-08-11**, ítem #7.
- [x] Pantalla Nueva activación: selector de categoría → escala dependiente → tipo de incidente →
      hora auto, con el armado de payload exacto por categoría (`FRONTEND-SPEC.md` sección 2).
      Generar `id` (UUID) client-side. **Cerrado 2026-08-11**, ítem #8.
- [x] Pantalla Evaluación inicial (rol restringido, encolable offline). **Cerrado 2026-08-11**,
      ítem #9.
- [x] Pantalla Marcador de incidente: input de coordenada de cuadrícula, badge "sin sincronizar"
      calculado client-side (no viene del backend). **Cerrado 2026-08-11**, ítem #9.
- [x] Relevo de mando (mismo componente que COE, reutilizado). **Cerrado 2026-08-13**, ítem #10.
- [x] Cola offline (IndexedDB): persistir escrituras encoladas de las 4 acciones críticas
      (activación, evaluación inicial, relevo, marcador), reintento automático al reconectar contra
      el mismo endpoint POST (idempotente por `id`, ADR-6). **Cerrado 2026-08-13**, ítem #10.
- [x] Lógica de "token blando": seguir encolando con token expirado mientras esté offline; al
      reconectar, re-login forzado con cola intacta (hueco 6.4). **Cerrado 2026-08-13**, ítem #10.
- [x] Ventana máxima de sesión offline — **24h** (no 12h; confirmado con Renzo 2026-08-12, ADR-7):
      exigir relogin para *nuevas* acciones si se supera, sin descartar lo ya encolado. **Cerrado
      2026-08-13**, ítem #10.
- [x] Aviso de actualización de versión PWA al reconectar (ADR-4) — nunca servir caché vieja en
      silencio. **Cerrado 2026-08-11**, ítem #7.

## Fase 4 — Endurecimiento

- [x] Tests de integración mínimos: al menos un flujo end-to-end por cliente (activación → evaluación
      → relevo → cierre) contra el backend real, no mocks — mismo criterio ya usado para verificar
      el backend contra PostgreSQL real en vez de una base simulada. **Cerrado 2026-08-14**, ítem
      #11 (walkthrough E2E documentado en `tasks/item-11-endurecimiento/todo.md`).
- [x] Verificación manual del límite de 3 clics en ambos clientes, con el shell de navegación 1A.
      **Cerrado 2026-08-14**: máximo 2 clics reales.
- [x] Accesibilidad básica: contraste, tamaño de tap targets. **Cerrado 2026-08-14**: contraste
      WCAG 2.2 AA ≥7.71:1 en todos los pares texto/fondo en uso; 6 componentes de formularios
      corregidos al token de 48px de tap target (solo los botones lo tenían).
- [ ] Confirmar con Renzo si el uso de guantes con la tablet GETAC exige un tap target mayor al
      estándar WCAG ya aplicado — no confirmado en el PRD, sigue abierto.
- [x] Prueba de pérdida de conectividad real en el Cliente PMM (no solo simulada en devtools): cortar
      red, completar los 4 flujos offline, reconectar, confirmar sincronización sin duplicados.
      **Cerrado 2026-08-13**, ítem #10 (repetido con JWT vencido firmado a mano).

## Fase 5 — Pendientes externos (no bloquean el desarrollo, sí el cierre del proyecto)

- [x] Respuesta del Jefe de Rescate: criterio real de convocatoria para MATPEL — **confirmado
      2026-08-11**, siempre "activación general" (sin escala por clase UN).
- [x] Confirmación de Renzo: ventana del token blando — **confirmado 2026-08-12**, 24h (no 12h,
      ver ADR-7).
- [x] Confirmación de Renzo: mecanismo de sync con token vencido (hueco 6.4) — **confirmado
      2026-08-12**: re-login forzado al reconectar, cola offline intacta, sync automático
      post-login, sin endpoint especial de backend.
- [x] Levantamiento/georreferenciación real del mapa cuadriculado — **resuelto por decisión
      2026-08-16 (Camino 2, confirmado con Renzo)**: en vez de levantar el mapa cuadriculado en
      papel, los marcadores nuevos capturan la posición por GPS de la tablet GETAC directamente
      (`MarcadorIncidenteScreen.tsx`, Cliente PMM) al registrarse, con input manual de respaldo si
      el GPS falla o no hay señal. Combinado con el workaround del 2026-08-15 (`MapaScreen.tsx`,
      Cliente COE, ubica sobre foto satelital del AIJC vía `georreferenciacion.ts` cualquier
      marcador con `coordenada_cuadricula` en lat/lon), los marcadores nuevos quedan
      georreferenciados de punta a punta sin depender del levantamiento físico del mapa en papel.
      Marcadores viejos con referencia de cuadrícula en papel (ej. "C4") siguen sin ubicarse en la
      foto — no se migran retroactivamente.
- [x] Matriz real de convocatoria (`rol_convocatoria`) contra GSEG-L-001 — **resuelto 2026-08-15**:
      sembrada con la lista real de § 4.2.2 para Aeronáutica (única categoría que el plan detalla);
      extendida a las otras 3 categorías por decisión de Renzo, ya que el plan no define una matriz
      propia para ellas — supuesto explícito, a confirmar con el Jefe de Rescate si cambia. Ver
      `backend/app/services/seed.py`.
- [x] Esquema real de columnas de `ReporteCierre` por categoría, contra los 4 Excel actuales —
      **resuelto 2026-08-15**: encabezados extraídos con openpyxl de los 4 "Cuadro Estadístico..."
      reales del Drive LAP; solo se autocompletan las columnas con correspondencia directa a un
      campo ya registrado por el PCE (Fecha/Mes/Hora, clasificación de origen, tipo de incidente,
      M4/M7 convocados), el resto queda en `None` — detalle operativo fuera de alcance v1. Ver
      `backend/app/services/reporte_cierre.py`.
