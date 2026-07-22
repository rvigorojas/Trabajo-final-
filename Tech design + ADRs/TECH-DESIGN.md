# Technical Design Document: PCE — Sistema de Puesto de Comando y Administración de Emergencias

**Tipo de proyecto:** Greenfield.
**Design.md disponible:** No, en formato Markdown — pero se usó `wireflame 0.1.pptx` (5 slides, 4
flujos: activación, vista COE, mapa geoespacial, relevo de mando, cada uno con 3 variantes de
exploración visual) como equivalente, extraído y analizado como insumo de diseño junto con el PRD.

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
  localmente y encola escrituras (evaluación inicial, relevo de mando, marcador de incidente)
  cuando no hay señal.
- **Cliente COE** — web app liviana (React + Vite), siempre online, sin lógica de almacenamiento
  local. Actualiza su dashboard por polling cada 5 segundos sobre el backend.
- **Backend (API principal)** — FastAPI (Python), expone la API REST/JSON que consumen ambos
  clientes: activaciones, convocatorias, unidades, Pre-PAI, relevos, marcadores de incidente,
  reportes de cierre.
- **Servicio de sincronización/cola** — pieza dedicada (también FastAPI) que recibe, encola y
  reconcilia los registros generados offline por el cliente PMM al reconectar.

```
Cliente PMM (offline-first) ──┐
                               ├──> Servicio de sync ──> Backend/API ──> Base de datos relacional
Cliente COE (online, polling)─┘                              ↑
                                                   Cliente COE consulta directo
```

## Decisiones de arquitectura

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](adrs/0001-componentes-y-repos.md) | División de componentes: PMM offline-first / COE online / servicio de sync | Aceptado |
| [ADR-0002](adrs/0002-modelo-de-datos-enfoque.md) | Modelo relacional normalizado con auditoría | Aceptado |
| [ADR-0003](adrs/0003-contratos-de-api.md) | REST sobre HTTP/JSON | Aceptado |
| [ADR-0004](adrs/0004-stack-por-componente.md) | FastAPI (backend/sync) + React/Vite (frontend) | Aceptado |
| [ADR-0005](adrs/0005-manejo-de-estado.md) | Polling periódico (5s) para el dashboard COE | Aceptado |
| [ADR-0006](adrs/0006-resiliencia-sync-offline.md) | Registros offline solo por inserción, nunca update | Aceptado |
| [ADR-0007](adrs/0007-autenticacion-y-control-de-acceso.md) | JWT de expiración corta para auth/RBAC offline-capable | Aceptado |
| [ADR-0008](adrs/0008-estrategia-de-despliegue.md) | Despliegue managed/serverless con autoscaling | Aceptado |

## Modelo de datos

Entidades principales, derivadas del PRD y del wireframe (ADR 2):

- **Activacion** — tipo de emergencia (aeronáutica/epidemiológica/estructural/MATPEL), nivel de
  alerta (I/II/III, o campo `tipo_alerta` 1-10 solo para aeronáutica), hora de activación, estado.
- **ConvocatoriaMiembro** — miembro convocado (COE o PMM), rol, activación asociada, hora de
  confirmación.
- **EvaluacionInicial** — tipo de incidente, magnitud, riesgos secundarios, activación asociada,
  registrada por el CI.
- **RelevoMando** — instancia (COE o PMM/CI), responsable saliente, responsable entrante, hora.
- **Unidad** — identificador (R1, R2, R8-R13, CR9), estado (OK / F.S. / N.A.), última actualización.
- **MarcadorIncidente** — coordenada de cuadrícula, tipo de incidente, riesgo, hora, activación
  asociada.
- **PrePAI** — plantilla por escenario (sector, riesgos, contactos de emergencia, recursos,
  estrategias de control, plano/acceso).
- **ReporteCierre** — snapshot exportable de una activación cerrada, con esquema de columnas
  equivalente al de los 4 Excel actuales (mismas columnas, mismo orden, por categoría).
- **LogAuditoria** — registro append-only de todo cambio relevante (quién, cuándo, sobre qué
  entidad), independiente de las tablas de negocio.

## Criterios de aceptación por flujo

### Activación de emergencia (Alerta I/II/III)

- [ ] Registrar una activación exige nivel de alerta y tipo/magnitud antes de notificar (según el
      flujo de 3 pasos del wireframe: nivel → tipo → notificar).
- [ ] Alerta II o III convoca automáticamente a los miembros de COE y PMM que corresponden según el
      Plan de Emergencia (sección 5 del PRD), sin que el usuario los seleccione manualmente uno por
      uno.
- [ ] Toda la acción de registrar una activación es alcanzable en 3 clics o menos desde la pantalla
      principal (PRD, sección 7).

### Evaluación inicial y transmisión al COE

- [ ] El CI puede registrar tipo, magnitud y riesgos secundarios desde el cliente PMM, incluso sin
      conexión (se encola localmente).
- [ ] Una vez sincronizada, la evaluación inicial aparece en el dashboard COE en un máximo de 5
      segundos (ADR 5).

### Biblioteca de Pre-PAI

- [ ] Los Pre-PAI existentes (mínimo: aeronáutico, GLP, médico) están disponibles y activables desde
      el sistema en menos de 30 segundos (criterio ya fijado en el PRD, sección 4).
- [ ] Activar un Pre-PAI precarga sector, riesgos, contactos, recursos y estrategias de control sin
      que el usuario deba re-ingresarlos.

### Relevo de mando

- [ ] Registrar un relevo (COE o PMM/CI) exige responsable saliente, entrante y hora, y queda
      inmutable una vez confirmado (ADR 2, ADR 6).
- [ ] El relevo rápido es alcanzable en 1 clic desde cualquier pantalla del dashboard COE (según la
      variante 1l del wireframe).

### Panel de estado de unidades

- [ ] El estado de cada unidad (OK/F.S./N.A.) se refleja en el cliente COE en un máximo de 5
      segundos desde que cambia en el backend (ADR 5).

### Mapa geoespacial — marcador de incidente

- [ ] El CI puede marcar la ubicación del incidente sobre el mapa cuadriculado desde el cliente PMM
      incluso sin señal; el marcador queda guardado localmente con indicador visible de "sin
      sincronizar" hasta reconectar (según el estado "SIN SEÑAL" del wireframe, flujo C).
- [ ] Al reconectar, el marcador se sincroniza automáticamente sin intervención manual del usuario.
- [ ] 100% de los incidentes Alerta II/III quedan con ubicación marcada en el mapa (criterio ya
      fijado en el PRD, sección 4).

### Modo offline (PMM)

- [ ] Perder conectividad no bloquea ninguna de las acciones críticas del PMM (evaluación inicial,
      relevo de mando, marcador de incidente) — todas quedan encoladas localmente (PRD, sección 7).
- [ ] Los registros generados offline se sincronizan como inserciones nuevas, nunca sobrescriben un
      registro existente (ADR 6).

### Exportación de reporte de cierre

- [ ] El reporte exportado de una activación cerrada reproduce las mismas columnas y el mismo orden
      que el Excel actual de su categoría (Aeronáutica, Epidemiológica, Estructural/Incidentes o
      MATPEL), confirmado con Renzo el 2026-07-21.

## Riesgos técnicos abiertos

- El detalle de las escalas de activación diferenciadas para las 3 categorías no aeronáuticas
  (Epidemiológica, Estructural/Incidentes, MATPEL) sigue sin definir (PRD, secciones 6 y 8) — el
  modelo de datos de `Activacion` asume un campo de nivel de alerta genérico por categoría, pero no
  puede cerrarse del todo hasta que esas escalas se definan formalmente.
- El levantamiento/georreferenciación en campo del mapa cuadriculado (PRD, sección 8) es un
  prerrequisito externo al desarrollo del software: sin coordenadas georreferenciables reales, el
  `MarcadorIncidente` no puede ubicarse sobre un mapa real, solo sobre la cuadrícula lógica.
- No se definió aún el proveedor cloud concreto para el despliegue managed/serverless (ADR 8) ni el
  motor de base de datos relacional específico (ADR 2) — quedan como decisiones de implementación a
  cerrar antes de empezar a construir.
