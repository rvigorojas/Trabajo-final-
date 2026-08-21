# PRD — Sistema de Puesto de Comando y Administración de Emergencias (PCE)

**Aeropuerto Internacional Jorge Chávez (LIM) — SSEI / Lima Airport Partners (LAP)**

## 1. Información general

| Campo | Valor |
|---|---|
| Documento | Product Requirements Document (PRD) |
| Producto | Sistema de Puesto de Comando y Administración de Emergencias (PCE) |
| Alcance geográfico | Aeropuerto Internacional Jorge Chávez (LIM) — Nuevo Terminal Único de Pasajeros |
| Operador aeroportuario | Lima Airport Partners (LAP) |
| Perfil de proceso | Bombero Aeronáutico (SSEI) |
| Sponsor / aprobador | Jefe de Rescate firmante revisor y como líder designado del PMM |
| Estado | Borrador v0.8 — cierra las 8 preguntas abiertas pendientes de confirmación con Renzo (offline en pista, control de acceso, trazabilidad, límite de 3 clics, escalas diferenciadas por categoría no aeronáutica, mapa sin coordenadas georreferenciables, no migración de histórico Excel, y los 3 criterios de éxito restantes), sobre la base v0.7 (requisito de usabilidad de 3 clics) y versiones anteriores. |
| Autor | Generado por asistente a solicitud de Renzo |
| Fecha | 2026-07-17 |
| Fuentes usadas | Plan de Emergencia del Aeropuerto Internacional Jorge Chávez — GSEG-L-001, v.001, 29/04/2025 (documento rector, 46 págs., leído completo en las secciones citadas); Pre-PAI existentes: RESC-D-006 (advertencia/accidente de aeronave), RESC-D-024 (fuga GLP), RESC-D-030 (paciente inconsciente); Carpeta Drive LAP — planillas de emergencias 2026, formatos RESC-F-007 a RESC-F-010/012/013/015/016/017/018/019/021/022/023/024, catálogo completo de procedimientos RESC-P-001 a P-016 y RESC-M-001 (Manual SSEI); Protocolo SCI Perú (2011-001, SINAGERD) y Curso Básico SCI (USAID/OFDA-LAC) como marco metodológico general |

## 2. Resumen ejecutivo

El PCE digitaliza el Plan de Emergencia del AIJC (GSEG-L-001), el procedimiento oficial y vigente que rige toda respuesta a emergencias en el aeropuerto. Este plan define dos instancias de mando reales:

- **COE (Centro de Operaciones de Emergencia)** — instancia estratégica, fija (Sala de Crisis), liderada por el Coordinador del Plan de Emergencia (Gerente de Seguridad; en su ausencia, Gerente de Operaciones Aeroportuarias; en su ausencia, Duty Manager).
- **PMM (Puesto de Mando Móvil)** — instancia táctica, en el sitio del incidente, liderada por el Jefe de Rescate (en su ausencia, Supervisor Gral. de Rescate; en su ausencia, Supervisor de Rescate). Durante la emergencia, quien lidera el PMM es identificado formalmente como "Comandante de Incidente".

El PCE es, en esencia, la digitalización de: la escala de Alerta I/II/III y su activación diferenciada de COE y PMM, el registro de la evaluación inicial y el informe transmitido del PMM al COE (equivalente al reporte inicial tipo SCI 201), los Pre-PAI ya existentes (RESC-D-006, RESC-D-024, RESC-D-030 y otros) como plantillas de respuesta por escenario, el relevo de mando (tanto a nivel COE como PMM/Comandante de Incidente), y un mapa geoespacial del AIJC donde se marca la ubicación exacta del incidente y se visualiza en tiempo real la posición de las unidades SSEI que están respondiendo. El Jefe de Rescate es el sponsor del proyecto y es, además, la máxima autoridad táctica (PMM/CI) que el sistema debe servir en primer lugar.

## 3. Problema y contexto operacional

El AIJC ya cuenta con un Plan de Emergencia aprobado y vigente que define roles, activación por niveles de alerta (I/II/III), instancias de mando (COE/PMM), organismos internos y externos, y fases (Antes/Durante/Post). Este plan no está digitalizado: la activación se coordina hoy por llamada telefónica y grupos de WhatsApp/Teams ("Emergencias Aeropuerto"), y el registro de la respuesta vive en los 4 Excel separados (Aeronáutica, Epidemiológica, Estructural/Incidentes, MATPEL) y en los Pre-PAI en Excel individuales por escenario.

El SSEI ya cuenta con Pre-Planes de Acción del Incidente (Pre-PAI) por tipo de escenario — ej. fuga de GLP, advertencia/accidente de aeronave, paciente inconsciente — con estructura estandarizada: identificación del sector, escenario, riesgos, tipo de emergencia, caracterización, contactos de emergencia, recursos logísticos/humanos, estrategias de control numeradas, plano del lugar, acceso al equipo, dimensiones del escenario. Estos Pre-PAI son plantillas estáticas en Excel que el personal de rescate consulta hoy; el PCE debería digitalizarlas y activarlas contextualmente según el tipo de incidente registrado, no reinventarlas.

La escala real de activación aeronáutica es Alerta I (monitoreo, sin activar COE), Alerta II (activación parcial de COE y PMM) y Alerta III (activación general/total) — no una escala numérica 1-10. Esto contradice/matiza lo asumido en v0.2-v0.3: la escala numérica "hasta Alerta 10" observada en los Excel de registro parece corresponder a una clasificación operativa interna distinta (posiblemente ampliada para cubrir escenarios de seguridad como interferencia ilícita, que el propio Plan de Emergencia excluye explícitamente y remite al Plan de Contingencias de la Gerencia de Seguridad). Pregunta abierta crítica: aclarar con el Jefe de Rescate si la escala I/II/III del Plan de Emergencia y la escala numérica 1-10 de los Excel son la misma cosa con distinta notación, o dos sistemas de clasificación paralelos que el PCE debe soportar ambos.

**Resolución (2026-07-17, basada en el análisis de 'Cuadro Estadístico de Emergencia Aeronáutica 2026.xlsx'):** son dos sistemas distintos, no la misma notación. La escala numérica 1-10 es el campo 'Tipo de Alerta', exclusivo del registro Aeronáutico — las otras 3 categorías usan sus propias clasificaciones: triaje Emergencia/Urgencia/Consulta en Epidemiológica, tipo de detector/panel en Estructural, y Clasificación MATPEL 1-9 por tipo de material. Dentro de la planilla Aeronáutica, Alerta 1 concentra el 80% de los registros reales (retornos sin novedad); los niveles superiores corresponden a tipos de evento específicos (3=derrame hidráulico, 4=derrame de combustible, 5=fuga MATPEL, 6=falla en aviónica, 7=fallo de control de vuelo, 8=fallo de tren de aterrizaje, 9=humo en cabina) y el nivel 10=interferencia ilícita, confirmado con un caso real (R13 y UDEX respondieron, PEA 21) — precisamente el escenario que GSEG-L-001 excluye explícitamente y remite al Plan de Contingencias de la Gerencia de Seguridad. El PCE debe soportar ambos sistemas en paralelo: la escala I/II/III oficial para activar COE/PMM según GSEG-L-001, y el campo Tipo de Alerta (1-10) como clasificación operativa granular del evento aeronáutico, replicando el criterio ya usado en el Excel actual.

El AIJC ya cuenta con un mapa cuadriculado del aeropuerto ("mapa de zona con sistema cuadriculado de coordenadas rectangulares para identificar puntos del terreno") usado hoy para ubicar accidentes de aeronave y para las rutas de acceso de emergencia. Este mapa es hoy estático (papel/PDF). Adicionalmente, las tablets GETAC ya instaladas en las unidades (R11, R12 confirmadas) ya traen geolocalización, pero esa geolocalización no se usa hoy en ningún panel de mando — es un recurso de hardware ya pagado y sin explotar. El PCE debe unir ambos: el mapa cuadriculado (georreferenciado) como base visual, y la geolocalización GETAC como fuente de posición en tiempo real de las unidades, para que el CI/COE puedan marcar el punto exacto del incidente y ver, sobre el mismo mapa, dónde está cada unidad respondiendo.

## 4. Objetivos y criterios de éxito

### Objetivos

- Digitalizar la activación y el seguimiento de emergencias según el Plan de Emergencia GSEG-L-001: notificación → alerta (I/II/III) → activación diferenciada de COE y PMM → evaluación inicial del Comandante de Incidente → informe al COE → respuesta → relevo (si aplica) → desactivación → revisión post-emergencia.
- Digitalizar los Pre-PAI existentes como plantillas activables por tipo de escenario (aeronáutico, MATPEL, médico, estructural, y los que se añadan), precargando recursos, riesgos, contactos y estrategias de control ya documentados.
- Unificar los 4 registros de emergencia hoy separados (Aeronáutica, Epidemiológica, Estructural/Incidentes, MATPEL) bajo el mismo flujo COE/PMM.
- Dar visibilidad en tiempo real del estado de unidades (R1, R2, R8-R13, CR9) y de los miembros activados de COE/PMM según el nivel de alerta.
- Registrar el relevo de mando tanto a nivel COE (ej. cuando llega la Gerente de Seguridad y releva al Duty Manager) como a nivel PMM/Comandante de Incidente (ej. cuando llega el Jefe de Rescate y releva al Supervisor Gral. de Rescate).
- Ser accesible desde el Puesto de Mando (PMM) vía tablet GETAC y desde el COE (Sala de Crisis) de forma fija.
- Ofrecer un mapa geoespacial del AIJC (sobre el mapa cuadriculado ya existente) donde se marque manualmente la ubicación exacta del incidente. La visualización en tiempo real de la posición de las unidades SSEI vía geolocalización GETAC queda fuera del alcance v1 (ver sección 6).

### Criterios de éxito (medibles)

| Criterio | Métrica objetivo | Estado |
|---|---|---|
| Digitalización de activación por alerta | 100% de activaciones Alerta II/III con registro digital de miembros COE/PMM convocados | Confirmado por Renzo, 2026-07-17 |
| Adopción de Pre-PAI digital | Los Pre-PAI existentes (mínimo 3: aeronáutico, GLP, médico) disponibles y activables desde el sistema en < 30 seg | Confirmado como objetivo |
| Consolidación de registros | 100% de las 4 categorías de emergencia en un solo sistema | Confirmado |
| Trazabilidad de relevo de mando | Registro de todo relevo (COE y PMM/CI) con hora, saliente, entrante | Confirmado — Plan de Emergencia 4.2.12.c |
| Informe inicial digital | Reemplazo de la comunicación verbal/WhatsApp del informe inicial del CI al COE por un registro estructurado (tipo, magnitud, riesgos secundarios) | Confirmado — Plan de Emergencia 4.2.4 |
| Disponibilidad del sistema | ≥ 99.9% uptime en horario operativo | Confirmado por Renzo, 2026-07-17 |
| Adopción del mapa geoespacial | 100% de incidentes Alerta II/III con ubicación marcada manualmente en el mapa | Confirmado por Renzo, 2026-07-17 |

*Autoevaluación de confianza sobre esta sección: 9/10.*

## 5. Usuarios y stakeholders

| Rol | Instancia | Necesidad principal |
|---|---|---|
| Jefe de Rescate (sponsor; Jorge Atarama Rodríguez) | Líder del PMM; Comandante de Incidente durante la emergencia | Aprobación del sistema; evaluación inicial y registro de la respuesta táctica en el sitio |
| Gerente de Seguridad (Coordinador del Plan de Emergencia) | Líder del COE | Visión estratégica, decisión de activación/desactivación, coordinación con organismos externos |
| Gerente de Operaciones Aeroportuarias | Suplente del líder del COE | Continuidad del mando estratégico si el Coordinador está ausente |
| Duty Manager (Jefe de Aeropuerto) | Segundo suplente del líder del COE; ordena activación parcial (Alerta II) | Activación inicial, coordinación con SGO |
| Supervisor Gral. de Rescate (M3) | Suplente del líder del PMM/CI | Evaluación y respuesta táctica cuando el Jefe de Rescate está ausente |
| Supervisor de Rescate (M6) | Miembro del PMM en activación parcial | Ejecución de tareas específicas asignadas por el CI |
| Rangos M4 / M7 | Personal de mando intermedio en sala de observación/comunicaciones | Reporte a contactos de emergencia; enlace con tripulación en Alerta I/II/III |
| Supervisor de Gestión de Operaciones (SGO) | Notifica al Duty Manager; contacta dependencias por orden del Coordinador | Canal de notificación inicial |
| Bombero Aeronáutico Conductor / Equipos A-B-C | Recurso de intervención | Checklist de inspección, reporte de estado |
| Servicio privado de atenciones médicas (SAI/Cardio Móvil) | Miembro del PMM | Atención médica in situ, reporte al PMM |
| CORPAC (CTA) | Fuente de la notificación de alerta aeronáutica | Canal de aviso, no forma parte de COE/PMM |
| Organismos externos (CGBVP, PNP, DIRESA, Defensa Civil, CIAA/SFRD-Ministerio Público, Migraciones, Aduanas, FF.AA.) | Se integran según la naturaleza de la emergencia, coordinados por el SGO bajo orden del Coordinador | Registro de su participación e integración al flujo del incidente |

## 6. Alcance del producto

### Dentro del alcance V1

- Registro de activación de emergencia con nivel de Alerta (I/II/III para eventos aeronáuticos; cada una de las otras 3 categorías con su propia escala diferenciada, confirmado que no comparten la escala aeronáutica — Renzo, 2026-07-17; detalle de cada escala cerrado — Renzo, 2026-07-21, ver sección 8) y tipo de incidente, y activación diferenciada de miembros de COE y/o PMM según el nivel. [El tipo de incidente se registra en este paso — Renzo, 2026-07-21] El formulario de activación selecciona primero la categoría de emergencia (Aeronáutica/Epidemiológica/Estructural-Incidente/MATPEL, preseleccionada en Aeronáutica) para desplegar el selector de escala correspondiente a esa categoría — hueco de diseño detectado y resuelto el 2026-07-30 (ver `Design.md`).
- Registro de la evaluación inicial del Comandante de Incidente (magnitud, riesgos secundarios) y transmisión estructurada de ese informe al COE — reemplazo digital del reporte verbal/WhatsApp actual.
- Biblioteca de Pre-PAI digitalizados, activables por tipo de escenario, con los campos ya estandarizados (sector, riesgos, contactos de emergencia, recursos logísticos/humanos, estrategias de control, plano/acceso al equipo).
- Registro de miembros convocados a COE y a PMM en cada activación (según las listas reales de Alerta II/III del Plan de Emergencia).
- Registro de relevo de mando: a nivel COE (ej. Duty Manager → Gerente de Seguridad) y a nivel PMM/CI (ej. Supervisor Gral. de Rescate → Jefe de Rescate), con hora y responsable saliente/entrante.
- Panel de estado de unidades SSEI (R1, R2, R8-R13, CR9) con estado de equipo (OK/F.S./N.A.) y estado de disponibilidad.
- Integración de organismos externos al registro del incidente cuando se movilizan (CGBVP, PNP, DIRESA, etc.), sin que el PCE gestione su despacho — solo su registro.
- Accesible desde el PMM vía tablet GETAC y desde el COE (Sala de Crisis) de forma fija (confirmado).
- Exportación de reporte de cierre / revisión post-emergencia, compatible con la estructura de los 4 Excel actuales.
- Mapa geoespacial del AIJC (sobre el mapa cuadriculado existente), con marcador manual de la ubicación del incidente (por el CI o por quien registra el aviso inicial).

### Fuera del alcance V1

- Reemplazo del canal de notificación primario (WhatsApp/Teams "Emergencias Aeropuerto") — el PCE registra y estructura, no sustituye el canal de alerta en tiempo real en v1.
- Gestión operativa de organismos externos (CGBVP, PNP, DIRESA, FF.AA., Ministerio Público/SFRD) — el PCE solo registra su participación, no coordina sus recursos internos.
- Digitalización completa de los formatos de inspección diaria de vehículo (RESC-F-XXX) — el PCE solo consume el estado agregado.
- El Plan de Contingencias de la Gerencia de Seguridad (interferencia ilícita) — explícitamente fuera del alcance del Plan de Emergencia GSEG-L-001 y, por tanto, fuera del alcance v1 del PCE.
- Creación de nuevos Pre-PAI — v1 digitaliza los existentes; la creación de nuevos escenarios queda para fases posteriores.
- Geolocalización en tiempo real de las unidades SSEI sobre el mapa vía tablets GETAC — v1 solo permite marcar manualmente la ubicación del incidente; el tracking en vivo de unidades queda para una fase posterior (alcance confirmado con Renzo el 2026-07-17).
- Cálculo de rutas óptimas de acceso o navegación turn-by-turn para las unidades — v1 solo visualiza la ubicación del incidente marcada manualmente, no calcula ni sugiere rutas.

## 7. Requisitos no funcionales

### Conectividad y disponibilidad

Las tablets GETAC operan en pista y plataforma, donde la señal de red corporativa puede perderse; el PCE debe soportar un modo offline con sincronización diferida para el registro del PMM (evaluación inicial, relevo de mando, marcador de mapa) cuando se pierda conectividad. [Confirmado — pérdida de señal en pista confirmada por Renzo, 2026-07-17]

Disponibilidad objetivo ≥ 99.9% en horario operativo (criterio ya definido en la sección 4).

### Control de acceso y roles

Acceso diferenciado por rol: la edición de la evaluación inicial y del relevo de mando queda reservada al CI (PMM) y al Coordinador/suplentes (COE); los rangos M4/M7 y el Supervisor de Rescate (M6) solo registran o consultan según su función en el Plan de Emergencia (ver sección 5). [Confirmado por Renzo, 2026-07-17]

### Trazabilidad y auditoría

Todo registro de activación, evaluación inicial, relevo de mando y cierre debe quedar con marca de tiempo y responsable, sin edición retroactiva no auditada — el PCE reemplaza reportes verbales/WhatsApp que hoy no dejan rastro formal, por lo que la trazabilidad es un requisito y no un añadido opcional. [Confirmado por Renzo, 2026-07-17]

### Usabilidad

Toda función del PCE debe ser alcanzable en máximo 3 clics desde la pantalla principal, tanto las acciones críticas de emergencia (activación de alerta, evaluación inicial del CI, marcador de mapa, relevo de mando) como las funciones de consulta/administración (biblioteca de Pre-PAI, panel de estado de unidades, reportes de cierre). Este límite refuerza la mitigación del riesgo de adopción ya identificado en la sección 8: minimizar fricción tanto en el momento crítico como en el uso cotidiano del sistema. [Confirmado por Renzo, 2026-07-17]

## 8. Riesgos y supuestos

- **Riesgo — adopción:** el personal de rescate y CTA ya tiene un flujo funcional por teléfono/WhatsApp/Teams; si el PCE agrega pasos sin reducir fricción en el momento crítico, puede no usarse durante la emergencia real y quedar solo para el registro posterior. Mitigación propuesta: el registro de evaluación inicial debe poder completarse en menos tiempo del que toma hoy el reporte verbal.
- **Riesgo — conectividad en pista:** si las tablets GETAC pierden señal durante una emergencia real, el PCE no debe bloquear el flujo operativo del CI (ver modo offline, sección 7).
- **Riesgo — doble registro:** mientras conviven el PCE y los 4 Excel actuales durante la transición, el personal podría registrar en ambos o en ninguno. Mitigación propuesta: definir una fecha de corte por categoría de emergencia.
- **Confirmado (Renzo, 2026-07-17)** — el mapa cuadriculado existente (hoy en papel/PDF) no tiene coordenadas georreferenciables utilizables tal cual; requiere trabajo de levantamiento/georreferenciación en campo antes de usarse como base del mapa geoespacial del PCE.
- **Confirmado (Renzo, 2026-07-17)** — las 3 categorías no aeronáuticas (Epidemiológica, Estructural/Incidentes, MATPEL) no comparten la escala I/II/III aeronáutica: cada una maneja su propia escala de activación diferenciada.
- **Confirmado (Renzo, 2026-07-21)** — detalle de la escala de activación diferenciada de cada categoría no aeronáutica (basado en los campos ya usados en 'Cuadro Estadístico de Emergencias Epidemiológicas 2026.xlsx', 'Cuadro Estadístico de Emergencias Estructurales e Incidentes 2026.xlsx' y 'Cuadro Estadístico de Emergencia MATPEL 2026.xlsx'):
  - **Epidemiológica** usa el triaje ya registrado (campo "Clasificación de la emergencia"): EMERGENCIA → activación general, URGENCIA → activación parcial, CONSULTA → monitoreo.
  - **Estructural/Incidentes** usa el campo ya registrado "Incidente / Estructural": Estructural → activación general, Incidente → activación parcial.
  - **MATPEL** usa la Clasificación MATPEL ya registrada, de 9 categorías por tipo de material (Clase 1 Explosivos, Clase 2 Gases, Clase 3 Líquidos inflamables, Clase 4 Sólidos inflamables, Clase 5 Sustancias oxidantes y peróxidos orgánicos, Clase 6 Sustancias tóxicas e infecciosas, Clase 7 Materiales radiactivos, Clase 8 Sustancias corrosivas, Clase 9 Misceláneos), sin mapeo a niveles de activación general/parcial/monitoreo — se usa tal cual como clasificación.

## 9. Glosario

| Término | Definición |
|---|---|
| SSEI | Servicio de Salvamento y Extinción de Incendios. |
| COE | Centro de Operaciones de Emergencia (instancia estratégica, Sala de Crisis). |
| PMM | Puesto de Mando Móvil (instancia táctica, en el sitio del incidente). |
| CI | Comandante de Incidente (quien lidera el PMM durante la emergencia). |
| GSEG-L-001 | código del Plan de Emergencia vigente del AIJC. |
| Pre-PAI | Pre-Plan de Acción del Incidente, plantilla de respuesta por escenario. |
| SCI | Sistema de Comando de Incidentes, metodología SINAGERD / OFDA-LAC usada como marco general. |
| GETAC | marca de las tablets robustas ya instaladas en las unidades SSEI. |
| CTA | Control de Tránsito Aéreo, fuente de la notificación de alerta aeronáutica (vía CORPAC). |
| SGO | Supervisor de Gestión de Operaciones. |
| M3 / M4 / M6 / M7 | rangos/roles del personal de rescate según el Plan de Emergencia. |
| MATPEL | Materiales Peligrosos. |
| PEA | Punto de Estacionamiento de Aeronave. |
| UDEX | Unidad de Desactivación de Explosivos (PNP). |
| RESC | prefijo de los códigos de procedimientos y formatos del SSEI (ej. RESC-D, RESC-F, RESC-I, RESC-P). |

## 10. Datos existentes y transición

El PCE no migra el histórico de los 4 Excel actuales (Aeronáutica, Epidemiológica, Estructural/Incidentes, MATPEL); arranca en blanco desde su puesta en marcha y esos Excel quedan como archivo histórico de referencia. [Confirmado por Renzo, 2026-07-17]

La carpeta Drive 'LAP' ya contiene la base documental para precargar la biblioteca de Pre-PAI y el panel de estado de unidades: manuales de equipo especializado (Lukas, Fanergy, Tychem, SKED, MSA G1, detectores de gas, AED), manuales de flota (Panther 6x6, Stinger, R3/R4, R5, EONE) e instructivos/formatos de inspección por unidad (R1/R2, R8/R9/R13, R10, R11/R12, CR9) y por equipo (mangueras RESC-I-001/003, escaleras RESC-I-043, pitones RESC-F-017/018, ERAS/LUNAR). Esta base ya está inventariada y lista para mapear al modelo de datos del PCE.

La planilla MATPEL 2026 revisada está vacía (solo plantilla, sin incidentes cargados) — no hay datos reales de esa categoría todavía para validar su clasificación dentro del PCE.
