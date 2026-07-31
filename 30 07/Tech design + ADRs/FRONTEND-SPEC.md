# Especificación Frontend — Cliente PMM y Cliente COE

## 0. Alcance y fuentes

Este documento especifica los dos clientes frontend del PCE (Cliente PMM offline-first y Cliente
COE online, ADR-1) contra el backend **ya implementado y verificado** (`backend/`, commits
`53126bc` + `f3ba454`, más la migración `0003_relevo_activacion_y_cierre` del 30/07 — 14/14 tests
contra PostgreSQL 16 real). Se deriva de:

- `PRD_PCE_JorgeChavez.3.md` (requisitos funcionales y no funcionales).
- `Design.md` (flujos A-D, variantes de wireframe elegidas, huecos resueltos).
- `TECH-DESIGN.md` + ADRs 0001-0008 (arquitectura, modelo de datos, decisiones técnicas).
- `Tablet_app_structures.pptx` (30/07 — 5 variantes de navegación completa 1A-1E + login 1F,
  todavía sin elegir por Renzo, ver sección 8).
- El código real del backend (`app/models`, `app/schemas`, `app/routers`) — este spec describe el
  contrato **tal como existe hoy**, no una versión idealizada.

No repite el modelo de datos ni las decisiones de arquitectura ya documentadas en `TECH-DESIGN.md`;
se enfoca en qué construye cada cliente, contra qué endpoint, y qué falta resolver para empezar.

## 1. Estructura de repo (propuesta, no decidida aún)

El repo ya tiene `backend/` en la raíz. Se propone un sibling `frontend/` con dos apps + un paquete
compartido, dado que ambos clientes son React + Vite (ADR-4) y comparten tipos/contrato de API pero
tienen perfiles de uso muy distintos (ADR-1):

```
frontend/
  packages/
    api-client/     # cliente HTTP tipado + tipos TS generados/espejados de los schemas Pydantic
  apps/
    coe/             # Cliente COE — web app online
    pmm/             # Cliente PMM — PWA offline-first (vite-plugin-pwa)
```

**Esto es una propuesta de organización, no una decisión ya tomada con Renzo** — ajustar si el
equipo prefiere dos repos separados o una estructura distinta.

## 2. Backend consumido — contrato real

Base URL de desarrollo: `http://localhost:8000` (docker-compose expone el puerto 8000). Todos los
endpoints salvo `POST /auth/login`, `POST /usuarios` y `GET /salud` requieren
`Authorization: Bearer <JWT>` (OAuth2 password bearer, `tokenUrl=auth/login`).

| Método | Ruta | Auth | Rol restringido | Body | Notas |
|---|---|---|---|---|---|
| POST | `/auth/login` | No | — | `{username, password}` | Devuelve `{access_token, token_type}` |
| POST | `/usuarios` | No* | — | `UsuarioCreate` | *Sin RBAC todavía (nota en el propio código) — bootstrap de cuentas, no exponer así en producción |
| GET | `/usuarios` | Sí | cualquiera | — | Lista completa, sin paginar |
| POST | `/activaciones` | Sí | cualquiera | `ActivacionCreate` | Idempotente por `id` (UUID generado por el cliente, ADR-6). Ver validación por categoría abajo |
| GET | `/activaciones` | Sí | cualquiera | — | Incluye `convocatoria` embebida |
| GET | `/activaciones/{id}` | Sí | cualquiera | — | Ídem, una sola |
| POST | `/activaciones/{id}/convocatoria/{miembro_id}/confirmar` | Sí | cualquiera | — | Marca `hora_confirmacion` de un convocado |
| POST | `/evaluaciones-iniciales` | Sí | `ROLES_EDICION_EVALUACION_RELEVO` | `EvaluacionInicialCreate` | Idempotente por `id` |
| GET | `/evaluaciones-iniciales` | Sí | cualquiera | — | Sin filtro por activación en el backend — filtrar client-side por `activacion_id` |
| POST | `/relevos-mando` | Sí | `ROLES_EDICION_EVALUACION_RELEVO` | `RelevoMandoCreate` (incluye `activacion_id`, obligatorio desde 2026-07-30) | Idempotente por `id` |
| GET | `/relevos-mando?activacion_id=` | Sí | cualquiera | — | Ordenado por `hora_recepcion`; el filtro `activacion_id` es opcional (sin él, devuelve todo el historial) |
| POST | `/activaciones/{id}/desactivar` | Sí | `ROLES_DESACTIVACION` (Gerente de Seguridad, Gerente de Operaciones Aeroportuarias, Duty Manager) | — | Agregado 2026-07-30. Única transición de `estado` permitida (`activa`→`cerrada`), idempotente |
| GET | `/unidades` | Sí | cualquiera | — | — |
| PUT | `/unidades/{identificador}` | Sí | cualquiera | `{estado}` | Upsert; last-write-wins por `hora_recepcion` (ADR-6), sin lógica de conflicto en el cliente |
| POST | `/marcadores-incidente` | Sí | cualquiera | `MarcadorIncidenteCreate` | Idempotente por `id`. `estado_sincronizado` siempre `true` en la respuesta — ver sección 5.3 |
| GET | `/marcadores-incidente` | Sí | cualquiera | — | Filtrar client-side por `activacion_id` |
| POST | `/pre-pai` | Sí | cualquiera | `PrePAICreate` | Catálogo, no ligado a ninguna activación |
| GET | `/pre-pai` | Sí | cualquiera | — | — |
| PUT | `/pre-pai/{id}` | Sí | cualquiera | `PrePAIUpdate` | Único recurso con UPDATE real (catálogo editable, no registro de incidente) |
| POST | `/reportes-cierre` | Sí | cualquiera | `{activacion_id}` | Genera snapshot; idempotente (devuelve el existente si ya se generó para esa activación) |
| GET | `/reportes-cierre/{id}` | Sí | cualquiera | — | — |
| GET | `/salud` | No | — | — | Health check |

**Roles restringidos** (`ROLES_EDICION_EVALUACION_RELEVO`, `app/deps.py`): Jefe de Rescate,
Sup. Gral. Rescate, Supervisor de Rescate, Gerente de Seguridad, Gerente de Operaciones
Aeroportuarias, Duty Manager — coincide con PRD sección 7 ("edición de evaluación inicial y relevo
reservada al CI y al Coordinador/suplentes"), pero el propio código anota que es una aproximación
estática (no rastrea quién es el CI activo ahora mismo — un Supervisor de Rescate que nunca asumió
como CI también pasa el check). El frontend no puede corregir esto por sí solo; documentarlo como
limitación conocida en la UI si hace falta.

**Validación de `POST /activaciones` por categoría** (`ActivacionCreate`, ya implementada
server-side — coincide con el hueco de diseño resuelto el 30/07 en `Design.md`/pptx):

- `tipo_emergencia` siempre obligatorio: `aeronautica | epidemiologica | estructural_incidentes | matpel`.
- Si `aeronautica`: **debe** venir `nivel_alerta` (`I|II|III`) y `tipo_alerta` (int 1-10); **no** debe
  venir `clasificacion_origen` (el backend lo rechaza con 422).
- Si **no** es `aeronautica`: **debe** venir `clasificacion_origen` (string); **no** deben venir
  `nivel_alerta` ni `tipo_alerta` (el backend los deriva y rechaza si igual llegan). Valores válidos
  de `clasificacion_origen` por categoría (ver `app/services/clasificacion.py`, códigos exactos que
  el frontend debe usar en sus selectores/dropdowns):
  - Epidemiológica: `"EMERGENCIA"` | `"URGENCIA"` | `"CONSULTA"` (mayúsculas exactas).
  - Estructural/Incidentes: `"Estructural"` | `"Incidente"` (capitalización exacta).
  - MATPEL: `"Clase 1"` … `"Clase 9"` (siempre deriva a activación general/`III`, criterio
    `[Propuesto]`, TECH-DESIGN.md § Riesgos técnicos abiertos).
- El campo "categoría de emergencia" del wireframe (Hueco resuelto 30/07) determina en la UI cuál de
  estos dos caminos tomar — el frontend arma el payload correcto según la categoría elegida, no envía
  campos "por si acaso".

## 3. Sesión, roles y navegación por instancia

`Rol` (`app/models/usuario.py`): `gerente_seguridad`, `gerente_operaciones_aeroportuarias`,
`duty_manager`, `jefe_rescate`, `supervisor_gral_rescate`, `supervisor_rescate`, `m4`, `m7`, `sgo`,
`bombero_aeronautico`, `servicio_medico`.

`InstanciaPrincipal`: `coe` | `pmm` — determina qué cliente usa normalmente ese usuario, pero el JWT
no impide loguearse en el otro cliente; la separación de app es una decisión de despliegue/UX, no
una restricción de backend. El login es el mismo formulario para ambos clientes (Opción 1F del
pptx) — "el rol define permisos, no la pantalla".

El JWT trae `sub` (usuario id), `rol`, `instancia_principal` como claims (`app/core/security.py`,
`app/deps.py`) — el cliente PMM debe decodificar estos claims localmente para decidir qué puede
encolar sin conexión (ADR-7), no asumir nada no presente en el token.

Dos listas de roles restringen acciones (`app/deps.py`): `ROLES_EDICION_EVALUACION_RELEVO` (Jefe de
Rescate, Sup. Gral. Rescate, Supervisor de Rescate, Gerente de Seguridad, Gerente de Operaciones
Aeroportuarias, Duty Manager) para evaluación inicial y relevo de mando; `ROLES_DESACTIVACION`
(Gerente de Seguridad, Gerente de Operaciones Aeroportuarias, Duty Manager — sin el Jefe de Rescate)
para cerrar una activación, agregada 2026-07-30 junto con el endpoint de desactivar. El frontend debe
ocultar o deshabilitar estas acciones en la UI cuando el rol del usuario logueado no está en la
lista correspondiente, aunque el backend ya las rechace con 403.

## 4. Cliente COE — pantallas

Basado en `Design.md` Flujo B (navegación de contenido, agnóstica del shell) y `Tablet_app_structures.pptx`
(shell de navegación — **Opción 1A, decidida 2026-07-30**, ver sección 8).

### Login (1F)
- Formulario usuario/contraseña → `POST /auth/login` → guardar `access_token`.
- "Funciona sin conexión si ya iniciaste sesión antes" es un requisito del **cliente PMM**, no del
  COE (el COE es siempre-online, ADR-1) — no construir lógica offline de login acá.

### Resumen
- Nivel de alerta activo, tipo de incidente, cronómetro desde `hora_evento` de la `Activacion`
  (`GET /activaciones/{id}`).
- Convocatoria COE X/3 · PMM X/3 — contar `convocatoria` embebida por `Usuario.instancia_principal`
  del convocado, confirmados = los que tienen `hora_confirmacion` no nulo.
- Evaluación inicial (magnitud, riesgos) — `GET /evaluaciones-iniciales` filtrado client-side por
  `activacion_id` (tipo de incidente NO se repite acá, se hereda de `Activacion`, `Design.md` Flujo B).
- "Últimos eventos" (log corto tipo feed) — **no hay endpoint de auditoría expuesto** (sección 6.2).
  Construir este feed en el cliente combinando los últimos N registros ya obtenidos por polling de
  `evaluaciones-iniciales`, `marcadores-incidente`, `relevos-mando` y confirmaciones de convocatoria,
  ordenados por `hora_recepcion` — no depender de `LogAuditoria`.
- Polling cada 3 segundos sobre estos endpoints (ADR-5).

### Mapa
- Capas activables/desactivables: Cuadrícula, Incidente, Accesos, Unidades (fase 2 — deshabilitada,
  fuera de alcance v1, PRD sección 6).
- Marcadores: `GET /marcadores-incidente` filtrado por `activacion_id`. El COE **solo lee**, no crea
  marcadores (crear es acción del PMM en campo, Flujo C).
- Base de mapa: cuadrícula lógica únicamente — sin coordenadas georreferenciables reales todavía
  (PRD sección 8, riesgo técnico abierto en TECH-DESIGN.md). No integrar un proveedor de mapas real
  (ej. Leaflet+OSM) esperando coordenadas que no existen aún; usar el sistema de cuadrícula tal cual.

### Unidades
- `GET /unidades` — estado OK/F.S./N.A. por unidad (R1, R2, R8-R13, CR9), `hora_recepcion` como
  "última actualización". Polling 3s.
- El COE puede además `PUT /unidades/{id}` si el flujo lo permite (el backend no distingue quién
  actualiza) — confirmar con Renzo si el COE debe poder editar estado de unidad o es solo lectura
  desde esa pantalla (no especificado en Design.md Flujo B).

### Comunicaciones
- Pestaña presente en la navegación de `Design.md` y el pptx, pero **sin entidad de datos definida**
  en `TECH-DESIGN.md` ni en el backend (no hay modelo de "mensaje" o "comunicación"). Placeholder de
  contenido a definir — no bloquea el resto del frontend, pero no inventar un backend para esto sin
  antes confirmar su alcance real con Renzo.

### Cadena de mando
- Historial de relevos — `GET /relevos-mando?activacion_id=<id de la activación en curso>`
  (filtro agregado 2026-07-30, migración `0003_relevo_activacion_y_cierre`).
- Formato de doble carril COE/PMM (`Design.md`, Hueco 4) — separar por `instancia` (`coe` |
  `pmm_ci`) del lado del cliente.

### Pre-PAI (menú aparte, no pestaña principal)
- `GET /pre-pai` — biblioteca completa. "Activar un Pre-PAI" (PRD, criterio de aceptación) es una
  acción **puramente frontend**: al elegir un Pre-PAI, precargar sus campos (sector, riesgos,
  contactos, recursos, estrategias de control) en el formulario de evaluación inicial que el usuario
  esté completando — no existe (ni debe crearse) un endpoint que "vincule" un Pre-PAI a una
  Activación en el backend.

### Reportes (menú aparte)
- `POST /reportes-cierre` (una vez por activación cerrada) + `GET /reportes-cierre/{id}` para ver/
  descargar. El campo `datos` es JSON genérico (columnas provisionales, no las reales de cada Excel
  — README del backend ya lo marca como pendiente conocido). El frontend puede renderizarlo como
  tabla genérica por ahora; no construir un exportador que asuma columnas específicas por categoría
  hasta que ese esquema se cierre contra el Excel real.

### Relevo de mando (acción rápida, 1 clic desde cualquier pantalla)
- Modal: `instancia` (COE/PMM), `responsable_saliente`, `responsable_entrante` → `POST
  /relevos-mando`. Rol restringido a `ROLES_EDICION_EVALUACION_RELEVO`.

### Desactivar
- `POST /activaciones/{id}/desactivar` (agregado 2026-07-30), restringido a `ROLES_DESACTIVACION`
  (Gerente de Seguridad, Gerente de Operaciones Aeroportuarias, Duty Manager — el Coordinador del
  Plan de Emergencia y sus suplentes, PRD sección 5; **no** el CI/PMM). Idempotente: si ya estaba
  cerrada, no falla.

## 5. Cliente PMM — pantallas y offline

### Login
- Mismo formulario que el COE (`POST /auth/login`), pero debe **funcionar sin conexión si el
  usuario ya se había logueado antes**: persistir el JWT localmente (IndexedDB/localStorage) y
  permitir reabrir la app sin llamar al backend si ya hay una sesión guardada.

### Nueva activación (Flujo A, variante 1c)
- Orden de campos (Hueco resuelto 30/07): **categoría de emergencia** (preseleccionada
  Aeronáutica) → selector de escala dependiente de la categoría → tipo de incidente → hora (auto,
  `hora_evento = now()` local) → convocatoria COE/PMM (solo lectura/informativa: el backend
  auto-convoca, el cliente no arma la lista de convocados manualmente, PRD/TDD criterio de
  aceptación).
- Generar `id` (UUID) en el cliente antes del POST, para idempotencia si hay que reintentar desde la
  cola offline (ADR-6).
- Armar el payload exacto según la categoría (sección 2) — nunca enviar `nivel_alerta` +
  `clasificacion_origen` juntos fuera de Aeronáutica.

### Evaluación inicial
- Magnitud + riesgos secundarios, `activacion_id` de la activación en curso. Tipo de incidente NO se
  vuelve a pedir (ya está en `Activacion`). Rol restringido.
- Puede completarse sin conexión — encolar localmente.

### Marcador de incidente (mapa)
- Coordenada de cuadrícula (input manual, no hay geolocalización GETAC integrada en v1 — PRD sección
  6, fuera de alcance), tipo de incidente, riesgo, capa.
- Badge "sin sincronizar": **estado local del cliente**, no del backend — `estado_sincronizado` en
  la respuesta del backend siempre es `true` (solo se guarda ahí una vez que el POST tuvo éxito). El
  badge se calcula en el cliente: `true` mientras el registro está en la cola local sin confirmar,
  `false`/oculto una vez que el POST devolvió 201.

### Relevo de mando
- Mismo formulario que el COE, disponible también desde el PMM para el relevo de CI. Rol
  restringido, puede encolarse offline.

### Mecanismo de cola offline (todo esto es lógica de cliente, no existe hoy en ningún lado)
- Persistencia local: IndexedDB (recomendado sobre localStorage por volumen/estructura — decisión de
  implementación, no de arquitectura, libre para el equipo).
- Cada escritura offline-capaz (activación, evaluación inicial, relevo de mando, marcador de
  incidente — ADR-6) se guarda localmente con su `id` generado y `hora_evento` real, y se reintenta
  al reconectar contra el mismo endpoint POST — el backend ya es idempotente por `id`, así que
  reintentar no duplica.
- **Token blando (ADR-7):** mientras el dispositivo esté offline, seguir aceptando y encolando
  acciones aunque el JWT decodificado ya esté expirado (no hay forma de renovarlo sin señal de todos
  modos). Al reconectar, reenviar la cola con el token que estaba vigente al crearse cada acción — el
  backend no valida antigüedad de esas escrituras, solo el JWT en el header de cada request; si el
  token ya expiró, sincronizar podría fallar con 401 dependiendo de qué tan viejo sea. **Esto es un
  hueco real: el backend no tiene hoy un mecanismo de "aceptar token vencido si viene de una cola
  offline"** — confirmar con Renzo si hace falta un endpoint de sync especial o si alcanza con
  refrescar el token en cuanto haya señal, antes de reenviar la cola (más simple, pero exige que el
  reconectar dispare primero un intento de login silencioso/refresh).
- Ventana máxima de sesión offline: `[Propuesto: 12h — a confirmar con Renzo, ADR-7]`. Si se supera,
  exigir relogin antes de encolar acciones *nuevas* (las ya encoladas dentro de la ventana no se
  pierden).
- Versionado del PWA (ADR-4): `vite-plugin-pwa` configurado para avisar "actualización disponible,
  reiniciar para aplicar" al reconectar, nunca servir caché vieja en silencio.

## 6. Huecos de backend a resolver

**6.1 y 6.3 — resueltos, 2026-07-30 (migración `0003_relevo_activacion_y_cierre`, verificada contra
Postgres real, 14/14 tests).** `RelevoMando` ya tiene `activacion_id` y `GET /relevos-mando` acepta
filtro opcional por ese campo; `POST /activaciones/{id}/desactivar` ya existe y cambia `estado` de
`activa` a `cerrada` (única transición de UPDATE permitida sobre `Activacion`, ver ADR 2 actualizado
y la sección 2/4/5 de este documento). Ver `bitacora-de-desarrollo.md`, Paso 14, para el detalle de
la implementación (incluido un bug real encontrado y corregido: SQLAlchemy guarda el nombre del enum
de Python en mayúsculas, no su `.value` en minúsculas que usa la API JSON — el trigger SQL crudo
tenía que compararse contra `'ACTIVA'`/`'CERRADA'`, no `'activa'`/`'cerrada'`).

**6.2 — Sin endpoint de auditoría/eventos.** `LogAuditoria` existe como tabla append-only pero
ningún router la expone. Recomendación: no agregar uno — construir el feed de "últimos eventos" del
Resumen del COE combinando los endpoints de dominio ya consumidos (sección 4), que ya traen toda la
información relevante con mejor forma que el log genérico (`tabla`/`registro_id`/`detalle` JSON).

**6.4 — Reconciliación con token vencido (sección 5, token blando).** El backend valida JWT en cada
request sin excepción para colas offline reconectando con token ya expirado — confirmar con Renzo
si hace falta resolverlo en el backend o alcanza con refrescar el token al detectar señal antes de
sincronizar la cola.

Quedan 2 huecos (6.2 es una decisión de diseño ya tomada, no bloquea nada; 6.4 sí requiere una
decisión de Renzo antes de cerrar la sincronización robusta del PMM). Ninguno bloquea seguir con el
resto del frontend.

## 7. Fuera de alcance (heredado del PRD, sección 6)

Sin cambios respecto al PRD: no reemplaza el canal WhatsApp/Teams, no gestiona organismos externos,
no digitaliza inspección diaria de vehículos, no cubre interferencia ilícita/Plan de Contingencias,
no crea nuevos Pre-PAI, no hace geolocalización en tiempo real de unidades ni cálculo de rutas.

## 8. Pendiente de decisión de Renzo

- **Shell de navegación:** **decidido 2026-07-30 — Opción 1A** (tabs inferiores + acciones
  flotantes para Relevo/Desactivar; en portrait la barra de tabs se comprime con scroll
  horizontal), de las 5 variantes de `Tablet_app_structures.pptx`. Este spec describe el
  contenido/dato de cada pantalla de forma agnóstica al shell, así que el trabajo de capas de datos
  y lógica de negocio (Fase 1-2 de `FRONTEND-TASKS.md`) no tiene que esperar; la implementación de
  navegación ya puede construirse directamente sobre 1A.
- Los 3 `[Propuesto]` ya conocidos (convocatoria MATPEL, ventana 12h del token blando, y ahora el
  mecanismo de sync con token vencido — hueco 6.4) siguen sin confirmar.
- Si el COE puede editar el estado de unidad desde su propia pantalla o es solo lectura ahí (sección
  4, "Unidades").
- Alcance real de la pestaña "Comunicaciones" (sección 4) — no tiene entidad de datos definida en
  ningún documento previo.
