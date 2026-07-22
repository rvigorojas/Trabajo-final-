# Bitácora de desarrollo — PCE (Puesto de Comando y Administración de Emergencias)

Registro cronológico del proceso completo de documentación del proyecto, desde el primer PRD hasta
el estado actual de `Documentacion 21 07/`. Proyecto propio de Renzo para el SSEI de Lima Airport
Partners (LAP), Aeropuerto Internacional Jorge Chávez — distinto del trabajo universitario ESAN
sobre down-time de vehículos Rosenbauer, aunque comparten la misma carpeta de Drive como fuente de
datos.

---

## Paso 1 — PRD v0.8 (2026-07-17)

Se redactó el Product Requirements Document a partir de fuentes documentales reales: el Plan de
Emergencia del AIJC (GSEG-L-001, v.001, 46 págs., leído completo en las secciones citadas), los
Pre-PAI existentes (RESC-D-006, RESC-D-024, RESC-D-030), la carpeta Drive LAP de planillas de
emergencias 2026 y el catálogo de procedimientos RESC, más el Protocolo SCI Perú (SINAGERD) y el
Curso Básico SCI (USAID/OFDA-LAC) como marco metodológico.

Sobre la base v0.7 (que ya fijaba el requisito de usabilidad de 3 clics), se cerraron con Renzo el
mismo día **8 preguntas abiertas**: offline en pista, control de acceso, trazabilidad, límite de 3
clics, escalas diferenciadas por categoría no aeronáutica, mapa sin coordenadas georreferenciables,
no migración de histórico Excel, y los 3 criterios de éxito restantes.

Un hallazgo central de esta ronda: la escala numérica "hasta Alerta 10" observada en los Excel de
registro **no es la misma** que la escala oficial I/II/III del Plan de Emergencia — son dos sistemas
paralelos. Se resolvió analizando `Cuadro Estadístico de Emergencia Aeronáutica 2026.xlsx`: la
escala 1-10 es el campo `Tipo de Alerta`, exclusivo de Aeronáutica, y debe coexistir con la escala
I/II/III oficial, no reemplazarla.

## Paso 2 — Wireframes y Design.md (2026-07-17 / 2026-07-21)

Se generó `wireflame 0.1.pptx` (17/07/2026, "estructura, no estilo final") con 4 flujos —
Activación, Vista COE, Mapa geoespacial, Relevo de mando — cada uno con 3 variantes exploradas.

El 21/07/2026, Renzo eligió una variante por flujo (1c, 1f, 1i, 1l) y se documentó en `Design.md`.
Al comparar la variante elegida contra las descartadas se detectaron y resolvieron 4 huecos de
diseño:

- **Flujo A (1c):** no mostraba tipo de incidente antes de convocar → se agregó el campo al panel de
  activación; magnitud/riesgos quedan para la evaluación inicial posterior del CI.
- **Flujo B (1f):** sin acceso a Pre-PAI ni Reportes → menú aparte del header, fuera de la barra de
  tabs principal.
- **Flujo C (1i):** sin estado offline visible → badge "sin sincronizar" junto al marcador, en vez
  de un banner de pantalla completa.
- **Flujo D (1l):** sin historial de relevos → pestaña dedicada "Cadena de mando" agregada a la
  vista COE.

## Paso 3 — PRD_PCE_JorgeChavez.3: cambios confirmados el 21/07

Sobre el v0.8 (que quedó intacto como borrador original), se confirmaron con Renzo dos cambios de
fondo:

1. El campo **tipo de incidente** se movió de la evaluación inicial a la activación (sección 6),
   coherente con el Hueco 1 del Flujo A de `Design.md`.
2. Se cerraron las **escalas de activación de las 3 categorías no aeronáuticas**, verificadas contra
   los Excel reales de la carpeta Drive LAP: Epidemiológica usa el triaje ya registrado
   (EMERGENCIA→general, URGENCIA→parcial, CONSULTA→monitoreo); Estructural/Incidentes usa el campo
   ya registrado Incidente/Estructural (Estructural→general, Incidente→parcial); MATPEL usa su
   Clasificación de 9 categorías UN ya registrada, sin mapeo a niveles de activación (se registra tal
   cual).

Existió una versión intermedia `PRD_PCE_JorgeChavez.2` que quedó duplicada de `.3` y se borró del
repo (commit `e3b6095`). Con `.3`, el PRD quedó sin preguntas abiertas pendientes de confirmación.

## Paso 4 — Technical Design Document + 8 ADRs

Se generaron `TECH-DESIGN.md` y los ADRs 0001-0008 con el skill `generar-tech-design` (instalado vía
`npx skills add adminoryslabs/Skills --skill generar-tech-design`), tomando como insumo `Design.md`
(no el pptx crudo). Decisiones aceptadas con Renzo: 3 componentes (PMM offline-first / COE online /
servicio de sync separado — ver Paso 8 para el cambio posterior), modelo relacional con auditoría,
REST/JSON, FastAPI + React/Vite, polling de 5s para el COE, escrituras offline solo por inserción,
JWT de expiración corta, despliegue managed/serverless.

## Paso 5 — Repositorio Git

Se creó el repo `https://github.com/rvigorojas/Trabajo-final-.git`. Primer commit el 21/07/2026
(`1459f2b`: PRD v0.8, wireframes, Design.md y TDD), seguido de:

- `5692cef` — mover TECH-DESIGN.md y adrs/ a la carpeta "Tech design + ADRs".
- `fe148f2` — regenerar TECH-DESIGN.md basado en Design.md en vez del wireframe crudo.
- `5cd4a5d` — cerrar las escalas de activación de las 3 categorías no aeronáuticas.
- `e0d98bd` — agregar PRD.3 (v0.8 + ambos cambios confirmados).
- `e3b6095` — eliminar PRD.2, duplicado de PRD.3.

`.claude/`, `.agents/` y `skills-lock.json` quedaron excluidos por `.gitignore` porque el symlink de
instalación de skills usa ruta absoluta y se rompe al clonar el repo en otra máquina.

## Paso 6 — Instalación del skill `revision-adversarial`

Se instaló vía `npx skills add adminoryslabs/Skills --skill revision-adversarial` (repositorio de
terceros, confirmado explícitamente antes de ejecutar por implicar confiar en instrucciones
externas). Se revisó el contenido de `SKILL.md` antes de usarlo: un solo archivo, sin lógica oculta
ni llamadas a red — su función es leer `TECH-DESIGN.md` + ADRs (y `PRD.md`/`Design.md` si están
disponibles) y producir un reporte de hallazgos sin editar los documentos directamente.

## Paso 7 — Revisión adversarial del TDD y los 8 ADRs

Ejecutada en una conversación distinta a la que generó el TDD (condición que el propio skill pide
para evitar sesgo de auto-validación). Se leyeron completos `TECH-DESIGN.md`, los 8 ADRs, `PRD.3` y
`Design.md`. Resultado: **4 hallazgos Crítico, 6 Advertencia, 2 Sugerencia**, más 3 ADRs (0003, 0004,
0008) que sostuvieron el escrutinio sin hallazgos reales.

**Críticos:**
1. Conflicto entre JWT de expiración corta (ADR-7) y el requisito offline prolongado (ADR-1): el CI
   podía quedar bloqueado en pleno incidente si el token expiraba sin señal.
2. Ninguna entidad de Usuario/Roster en el modelo de datos, pese a que ADR-7 (login) y la
   convocatoria automática de Flujo A la necesitaban.
3. `TECH-DESIGN.md` describía `nivel_alerta` y `tipo_alerta` como alternativos para Aeronáutica,
   contradiciendo la resolución confirmada del PRD (coexisten en paralelo).
4. Sin definición de qué dispara la convocatoria automática para MATPEL, que no tiene mapeo a nivel
   de activación.

**Advertencias:** referencia a una variante de wireframe ("1g") que ya no existe en `Design.md`;
ADR-6 omitía "activación" entre los registros offline; sin decisión sobre confianza en el reloj del
dispositivo para timestamps offline; mecanismo de "sin edición retroactiva" dejado sin resolver en
ADR-2; entidad `PrePAI` incompleta frente a los campos que el PRD ya documenta; intervalo de polling
(5s) sin margen bajo su propio criterio de aceptación (máximo 5s).

**Sugerencias:** sin estrategia de versionado de caché para el PWA; proporcionalidad cuestionable de
mantener el servicio de sync como componente desplegable aparte para un equipo de 1-3 personas.

## Paso 8 — Resolución de los 4 Críticos

Con decisiones tomadas junto a Renzo (vía preguntas dirigidas, no supuestos):

- **JWT/offline:** mecanismo de "token blando" — el cliente PMM sigue aceptando y encolando acciones
  con el token vencido mientras siga offline; al reconectar, el backend acepta lo ya encolado. Se
  fijó una ventana máxima de sesión offline de 12h (`[Propuesto]`, un turno operativo).
- **Entidad Usuario:** agregada al modelo de datos de `TECH-DESIGN.md`, con los roles del PRD
  (sección 5) y referenciada desde `ConvocatoriaMiembro`.
- **`nivel_alerta`/`tipo_alerta`:** corregida la redacción para reflejar que coexisten en paralelo
  para Aeronáutica, no que son alternativos.
- **Convocatoria MATPEL:** fijada como "siempre activación general" (criterio conservador, sin datos
  reales para una escala diferenciada — la planilla MATPEL 2026 está vacía), marcado
  `[Propuesto, pendiente de confirmar con el Jefe de Rescate]`.

## Paso 9 — Resolución de las 6 Advertencias y 2 Sugerencias

También con decisiones explícitas de Renzo donde correspondía:

- ADR-1 corregido: cita la variante 1i real de `Design.md`, no la "1g" obsoleta.
- ADR-6 corregido: "activación" agregada a la lista de registros offline insert-only.
- ADR-2 ampliado: doble timestamp (`hora_evento` del dispositivo para mostrar, `hora_recepcion` del
  backend para auditoría y para el last-write-wins de `Unidad`, ADR-6) — un reloj de tablet
  desincronizado ya no puede alterar el orden de la auditoría.
- ADR-2 ampliado: mecanismo de "sin edición retroactiva" en dos capas (API sin UPDATE/DELETE +
  trigger de base de datos como respaldo, una vez elegido el motor).
- `PrePAI` completada con los campos que el PRD ya documentaba (tipo de emergencia, caracterización,
  dimensiones del escenario, nombre del escenario).
- Polling bajado de 5s a 3s (ADR-5), para dejar margen real bajo el criterio de aceptación de 5s.
- ADR-4 ampliado con estrategia de versionado del PWA (aviso de actualización al reconectar +
  retrocompatibilidad de payloads offline).
- **Servicio de sync fusionado con el backend** (decisión de Renzo): ADR-1 reescrito con nota de
  cambio explícita; ADR-3, ADR-4, ADR-5, ADR-7 y ADR-8 actualizados para reflejar 3 componentes en
  vez de 4 (Cliente PMM, Cliente COE, Backend — que incluye el módulo de sincronización).

## Paso 10 — Autorevisión del diff antes de commitear

Al revisar el propio diff antes de proponer el commit, se detectaron y corrigieron 2 problemas
adicionales introducidos en el Paso 9:

- Typo de consistencia: `EvaluaciónInicial` (con tilde) en vez de `EvaluacionInicial` (nombre de
  entidad, sin tilde) en la lista de tablas sin UPDATE/DELETE de ADR-2.
- El doble timestamp decidido en ADR-2 no se había reflejado en las entidades `Activacion`,
  `RelevoMando` y `MarcadorIncidente` del modelo de datos de `TECH-DESIGN.md` — corregido.

## Paso 11 — Reorganización a `Documentacion 21 07/`

Con `git mv` (preserva historial), se movió desde la raíz del repo a esta carpeta: el PRD vigente
(`PRD_PCE_JorgeChavez.3.md` y `.docx` — el v0.8 original queda en la raíz como referencia histórica),
`Design.md`, y la carpeta completa `Tech design + ADRs/` con las correcciones de los Pasos 8-10 ya
aplicadas.

---

## Estado actual

- PRD vigente: `.3`, sin preguntas abiertas pendientes de confirmación general. Quedan 2 supuestos
  `[Propuesto]` explícitos dentro del TDD (convocatoria MATPEL, ventana de sesión offline de 12h) a
  confirmar con el Jefe de Rescate y con Renzo respectivamente — no bloquean el desarrollo.
- TDD y los 8 ADRs: revisados adversarialmente, con los 4 Críticos, 6 Advertencias y 2 Sugerencias
  resueltos y documentados en el propio texto de cada ADR (no se ocultó ningún cambio; cada
  corrección referencia explícitamente la revisión del 2026-07-21).
- Repo: los cambios de los Pasos 8-11 (ediciones de contenido + `git mv`) están en el árbol de
  trabajo/staging, **pendientes de commit**.
- Pendiente externo: respuesta del Jefe de Rescate sobre el criterio real de convocatoria para
  emergencias MATPEL.
