# Technical Design Document: PCE — Sistema de Puesto de Comando y Administración de Emergencias

**Tipo de proyecto:** Greenfield.
**Design.md disponible:** Sí — 4 flujos (Activación, Vista COE, Mapa geoespacial, Relevo de mando),
cada uno con la variante de wireframe elegida por Renzo y sus huecos de diseño ya resueltos
(2026-07-21, más un hueco adicional del Flujo A resuelto 2026-07-30 al revisar
`Tablet_app_structures.pptx`). El modelo de datos de este documento se deriva de `Design.md`, no ya
del `wireflame 0.1.pptx` crudo.

## Resumen

El PCE digitaliza el Plan de Emergencia del AIJC (GSEG-L-001): la activación diferenciada de COE y
PMM por nivel de alerta, la evaluación inicial y el informe del PMM al COE, los Pre-PAI existentes
como plantillas activables, el relevo de mando, el panel de estado de unidades SSEI y un mapa
geoespacial con marcador manual de incidentes. El requisito no funcional más determinante del diseño
es que el cliente PMM (tablet GETAC, en pista) debe seguir operando cuando pierde señal, con
sincronización diferida al reconectar — esta necesidad offline-first moldea la división de
componentes, el modelo de datos y la estrategia de resiliencia descritas abajo.

## Arquitectura de componentes

- **Cliente PMM** — PWA offline-first (React + Vite, `vite-plugin-pwa`) para tablet GETAC. Guarda
  localmente y encola escrituras (activación con tipo de incidente, evaluación inicial, relevo de
  mando, marcador de incidente) cuando no hay señal.
- **Cliente COE** — web app liviana (React + Vite), siempre online, sin lógica de almacenamiento
  local. Actualiza su dashboard por polling cada 3 segundos sobre el backend (ADR 5, ajustado de 5s
  a 3s en la revisión adversarial de 2026-07-21 para dejar margen real bajo el criterio de
  aceptación de "máximo 5 segundos"). Navegación según
  `Design.md`: pestañas **Resumen / Mapa / Unidades / Comunicaciones / Cadena de mando**, menú
  aparte del header para **Pre-PAI** y **Reportes**, y acciones rápidas persistentes (**Relevo**,
  **Desactivar**).
- **Backend (API principal + módulo de sincronización)** — FastAPI (Python), expone la API
  REST/JSON que consumen ambos clientes: activaciones, convocatorias, unidades, Pre-PAI, relevos,
  marcadores de incidente, reportes de cierre. Incluye, como router/módulo interno (no como
  servicio desplegable aparte — ver ADR-1, revisado 2026-07-21), la reconciliación de los registros
  generados offline por el cliente PMM al reconectar.

```
Cliente PMM (offline-first) ──┐
                               ├──> Backend/API (incl. sync) ──> Base de datos relacional
Cliente COE (online, polling)─┘
```

## Decisiones de arquitectura

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](adrs/0001-componentes-y-repos.md) | División de componentes: PMM offline-first / COE online / backend (incl. sync) | Aceptado |
| [ADR-0002](adrs/0002-modelo-de-datos-enfoque.md) | Modelo relacional normalizado con auditoría | Aceptado |
| [ADR-0003](adrs/0003-contratos-de-api.md) | REST sobre HTTP/JSON | Aceptado |
| [ADR-0004](adrs/0004-stack-por-componente.md) | FastAPI (backend, incl. sync) + React/Vite (frontend) | Aceptado |
| [ADR-0005](adrs/0005-manejo-de-estado.md) | Polling periódico (3s) para el dashboard COE | Aceptado |
| [ADR-0006](adrs/0006-resiliencia-sync-offline.md) | Registros offline solo por inserción, nunca update | Aceptado |
| [ADR-0007](adrs/0007-autenticacion-y-control-de-acceso.md) | JWT de expiración corta para auth/RBAC offline-capable | Aceptado |
| [ADR-0008](adrs/0008-estrategia-de-despliegue.md) | Despliegue managed/serverless con autoscaling | Aceptado |

## Modelo de datos

Entidades principales, derivadas de `Design.md` (ADR 2):

- **Activacion** — tipo de emergencia (aeronáutica/epidemiológica/estructural/MATPEL), nivel de
  alerta (I/II/III — las 4 categorías) y, **solo para Aeronáutica, además y en paralelo**, el campo
  `tipo_alerta` (1-10) como clasificación operativa granular (PRD, sección 3: ambos sistemas
  coexisten, no son alternativos — corrige una redacción previa de este documento que los presentaba
  como mutuamente excluyentes), **tipo de incidente** (capturado en este paso, Flujo A —
  `Design.md`), `hora_evento`/`hora_recepcion` (ADR 2), estado. El nivel de alerta se deriva de un campo de clasificación
  propio por categoría (PRD, sección 8, confirmado 2026-07-21): triaje EMERGENCIA/URGENCIA/CONSULTA
  en Epidemiológica, campo Incidente/Estructural en Estructural/Incidentes, y Clasificación MATPEL de
  9 categorías en MATPEL. **MATPEL — `nivel_alerta` = activación general, siempre.** Confirmado con
  el Jefe de Rescate (2026-08-11): la Clasificación MATPEL (9 categorías UN) no tiene mapeo real a
  nivel de activación, y la planilla MATPEL 2026 está vacía (PRD sección 10) — no hay incidentes
  reales de donde derivar una escala diferenciada por clase con el mismo rigor usado en
  Epidemiológica/Estructural. Se adopta un criterio conservador fijo en vez de inventar una escala de
  severidad sin datos: toda activación MATPEL, sin importar la clase UN registrada, dispara
  convocatoria automática general (equivalente a Alerta III) — materiales peligrosos ameritan por
  defecto la respuesta más amplia disponible. Revisar este criterio si en producción se junta
  suficiente historial real de incidentes MATPEL para justificar una escala diferenciada.
- **Usuario** — persona con cuenta en el sistema: nombre, rol (uno de los roles del Plan de
  Emergencia listados en PRD sección 5: Gerente de Seguridad, Gerente Operaciones Aeroportuarias,
  Duty Manager, Jefe de Rescate, Sup. Gral. de Rescate, Supervisor de Rescate, M4, M7, SGO, etc.),
  instancia principal (COE / PMM), contacto, credenciales de acceso, estado (activo/inactivo).
  Entidad requerida por ADR-7 (login/JWT) y por la convocatoria automática de Flujo A (el sistema
  necesita saber quién ocupa cada rol para convocarlo) — no estaba modelada en una versión anterior
  de este documento.
- **ConvocatoriaMiembro** — miembro convocado (COE o PMM), referencia al `Usuario` convocado, rol,
  activación asociada, hora de confirmación.
- **EvaluacionInicial** — magnitud, riesgos secundarios, activación asociada, registrada por el CI.
  El tipo de incidente ya no vive acá: se hereda de `Activacion` (Flujo B, `Design.md`).
- **RelevoMando** — **activación asociada** (`activacion_id`, agregada 2026-07-30 — hasta esa fecha
  el modelo real no tenía este campo pese a que ya se documentaba acá, hueco detectado al escribir
  `FRONTEND-SPEC.md` y corregido en la migración `0003_relevo_activacion_y_cierre`), instancia (COE
  o PMM/CI), responsable saliente, responsable entrante, `hora_evento`/`hora_recepcion` (ADR 2).
  Listado histórico filtrable por activación, consultable desde la pestaña "Cadena de mando" del
  cliente COE (Flujo D, `Design.md`).
- **Unidad** — identificador (R1, R2, R8-R13, CR9), estado (OK / F.S. / N.A.), última actualización
  (`hora_recepcion` — es el campo mutable que usa last-write-wins, ADR 6, por eso no lleva
  `hora_evento` propio).
- **MarcadorIncidente** — coordenada de cuadrícula, tipo de incidente, riesgo,
  `hora_evento`/`hora_recepcion` (ADR 2), capa a la que pertenece (Cuadrícula / Incidente / Accesos /
  Unidades-fase 2), **estado de sincronización**
  (sincronizado / pendiente, mostrado como badge junto al marcador — Flujo C, `Design.md`),
  activación asociada.
- **PrePAI** — plantilla por escenario: nombre del escenario, sector, **tipo de emergencia**,
  **caracterización**, riesgos, contactos de emergencia, recursos logísticos/humanos, estrategias de
  control, plano del lugar/acceso al equipo, **dimensiones del escenario** (campos completados en la
  revisión adversarial de 2026-07-21 — la versión anterior de esta entidad no cubría todos los
  campos que el PRD, sección 3, ya documenta como parte de la estructura estandarizada de los Pre-PAI
  existentes). Accesible desde el menú aparte del cliente COE, no desde las pestañas principales
  (`Design.md`).
- **ReporteCierre** — snapshot exportable de una activación cerrada, con esquema de columnas
  equivalente al de los 4 Excel actuales (mismas columnas, mismo orden, por categoría). Accesible
  desde el mismo menú aparte que Pre-PAI.
- **LogAuditoria** — registro append-only de todo cambio relevante (quién, cuándo, sobre qué
  entidad), independiente de las tablas de negocio.

## Criterios de aceptación por flujo

### Activación de emergencia (Alerta I/II/III)

- [ ] Registrar una activación exige elegir primero la categoría de emergencia (Aeronáutica /
      Epidemiológica / Estructural-Incidente / MATPEL, preseleccionada en Aeronáutica por defecto),
      lo que determina cuál selector de nivel/escala se muestra (Alerta I/II/III, triaje, o
      Clasificación MATPEL según corresponda — Hueco de diseño resuelto 2026-07-30, `Design.md`),
      además de tipo de incidente y la convocatoria dividida en columnas COE/PMM antes de notificar
      (Flujo A, variante 1c de `Design.md`).
- [ ] Alerta II o III convoca automáticamente a los miembros de COE y PMM que corresponden según el
      Plan de Emergencia (sección 5 del PRD), sin que el usuario los seleccione manualmente uno por
      uno.
- [ ] Toda la acción de registrar una activación es alcanzable en 3 clics o menos desde la pantalla
      principal (PRD, sección 7).

### Evaluación inicial y transmisión al COE

- [ ] El CI puede registrar magnitud y riesgos secundarios desde el cliente PMM, incluso sin
      conexión (se encola localmente) — el tipo de incidente ya quedó fijado en la activación y no
      se vuelve a pedir.
- [ ] Una vez sincronizada, la evaluación inicial aparece en el dashboard COE (pestaña Resumen) en
      un máximo de 5 segundos (ADR 5 — polling cada 3s deja margen real bajo ese máximo).

### Biblioteca de Pre-PAI

- [ ] Los Pre-PAI existentes (mínimo: aeronáutico, GLP, médico) están disponibles y activables desde
      el menú aparte del cliente COE en menos de 30 segundos (criterio ya fijado en el PRD, sección
      4; ubicación confirmada en `Design.md`).
- [ ] Activar un Pre-PAI precarga sector, riesgos, contactos, recursos y estrategias de control sin
      que el usuario deba re-ingresarlos.

### Relevo de mando

- [ ] Registrar un relevo (COE o PMM/CI) exige responsable saliente, entrante y hora, y queda
      inmutable una vez confirmado (ADR 2, ADR 6).
- [ ] El relevo rápido es alcanzable en 1 clic desde cualquier pantalla del dashboard COE (Flujo D,
      variante 1l de `Design.md`).
- [ ] El historial completo de relevos (COE y PMM/CI, con hora, saliente y entrante) es consultable
      en la pestaña dedicada "Cadena de mando" del cliente COE, filtrable por activación
      (`GET /relevos-mando?activacion_id=...`, agregado 2026-07-30).

### Desactivación de una activación

- [ ] El Coordinador del Plan de Emergencia (Gerente de Seguridad o sus suplentes, PRD sección 5) —
      no el CI/PMM — puede cerrar una activación (`POST /activaciones/{id}/desactivar`, agregado
      2026-07-30), cambiando `estado` de `activa` a `cerrada`. Es la única transición de UPDATE
      permitida sobre `Activacion` (ver ADR 2), reforzada por un trigger de DB dedicado y auditada
      como cualquier otro cambio relevante.
- [ ] Desactivar una activación ya cerrada es idempotente (no falla, devuelve el estado actual).

### Panel de estado de unidades

- [ ] El estado de cada unidad (OK/F.S./N.A.) se refleja en el cliente COE en un máximo de 5
      segundos desde que cambia en el backend (ADR 5 — polling cada 3s deja margen real bajo ese
      máximo).

### Mapa geoespacial — marcador de incidente

- [ ] El CI puede marcar la ubicación del incidente sobre el mapa cuadriculado desde el cliente PMM
      incluso sin señal; el marcador queda guardado localmente con un badge visible de "sin
      sincronizar" junto al marcador hasta reconectar (Flujo C, variante 1i de `Design.md`).
- [ ] Al reconectar, el marcador se sincroniza automáticamente y el badge desaparece, sin
      intervención manual del usuario.
- [ ] Las capas del mapa (Cuadrícula, Incidente, Accesos, Unidades-fase 2) se activan/desactivan
      independientemente sin recargar la pantalla.
- [ ] 100% de los incidentes Alerta II/III quedan con ubicación marcada en el mapa (criterio ya
      fijado en el PRD, sección 4).

### Modo offline (PMM)

- [ ] Perder conectividad no bloquea ninguna de las acciones críticas del PMM (activación con tipo
      de incidente, evaluación inicial, relevo de mando, marcador de incidente) — todas quedan
      encoladas localmente (PRD, sección 7).
- [ ] Los registros generados offline se sincronizan como inserciones nuevas, nunca sobrescriben un
      registro existente (ADR 6).

### Exportación de reporte de cierre

- [ ] El reporte exportado de una activación cerrada reproduce las mismas columnas y el mismo orden
      que el Excel actual de su categoría (Aeronáutica, Epidemiológica, Estructural/Incidentes o
      MATPEL), confirmado con Renzo el 2026-07-21.
- [ ] El reporte es accesible desde el menú aparte del cliente COE (`Design.md`), no desde las
      pestañas principales del dashboard en vivo.

## Riesgos técnicos abiertos

- El levantamiento/georreferenciación en campo del mapa cuadriculado (PRD, sección 8) es un
  prerrequisito externo al desarrollo del software: sin coordenadas georreferenciables reales, el
  `MarcadorIncidente` no puede ubicarse sobre un mapa real, solo sobre la cuadrícula lógica.
- No se definió aún el proveedor cloud concreto para el despliegue managed/serverless (ADR 8) ni el
  motor de base de datos relacional específico (ADR 2) — quedan como decisiones de implementación a
  cerrar antes de empezar a construir.
- **Confirmado con Renzo (2026-08-12)**: la ventana máxima de sesión offline del token "blando"
  (ADR 7) es de 24 horas. Al superarla, exigir relogin antes de encolar acciones nuevas (las ya
  encoladas dentro de la ventana no se pierden).
- **Confirmado con Renzo (2026-08-12)**: reconciliación con token vencido al reconectar (hueco 6.4,
  `FRONTEND-SPEC.md`) — no se agrega endpoint de sync especial al backend. El Cliente PMM exige
  re-login al detectar reconexión con JWT vencido; la cola offline en IndexedDB se conserva intacta
  y se sincroniza automáticamente contra el mismo POST idempotente en cuanto hay sesión válida.
