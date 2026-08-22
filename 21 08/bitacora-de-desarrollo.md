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

> **Nota de trazabilidad, agregada el 2026-08-21.** No quedó registrado en su momento con qué skill
> se generó el primer PRD. Lo que sí se puede verificar hoy: su estructura de 10 secciones
> numeradas (Información general, Resumen ejecutivo, Problema y contexto operacional, Objetivos y
> criterios de éxito, Usuarios y stakeholders, Alcance, Requisitos no funcionales, Riesgos y
> supuestos, Glosario, Datos existentes y transición, con autoevaluación de confianza por sección)
> **no coincide** con la plantilla de 8 secciones de `generar-prd` ni de
> `generar-prd-conversacional` — las dos skills de PRD instaladas a nivel de usuario. Contraste
> útil: el PRD del otro proyecto de clase (Alwa) sí sigue el formato exacto de `generar-prd`, con
> sus marcas `<!-- REVISAR: ... -->`. La conclusión honesta es que este PRD se construyó
> conversando sobre fuentes primarias reales y se refinó en seis versiones sucesivas
> (v0.2 → v0.3 → v0.7 → v0.8 → `.3` → `.4`), no en una sola pasada de skill.

Un hallazgo central de esta ronda: la escala numérica "hasta Alerta 10" observada en los Excel de
registro **no es la misma** que la escala oficial I/II/III del Plan de Emergencia — son dos sistemas
paralelos. Se resolvió analizando `Cuadro Estadístico de Emergencia Aeronáutica 2026.xlsx`: la
escala 1-10 es el campo `Tipo de Alerta`, exclusivo de Aeronáutica, y debe coexistir con la escala
I/II/III oficial, no reemplazarla.

## Paso 2 — Wireframes y Design.md (2026-07-17 / 2026-07-21)

**Herramienta usada: Claude Design** (confirmado por Renzo el 2026-08-21; no estaba registrado
antes). Las variantes de wireframe se exploraron ahí tomando el PRD ya pulido como input — el
puente PRD → Design.md que plantea la sesión 6 del curso — y el resultado se volcó a
`wireflame 0.1.pptx` para revisión. `Design.md` es el paso siguiente: fija cuál de las 3 variantes
de cada flujo se implementa y cierra los huecos que la exploración dejó abiertos.

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

> **Revisado el 2026-08-21.** La razón de arriba era correcta, pero se aplicó de más: el problema
> del symlink afecta a `.claude/skills/` y `.agents/skills/` — no a `skills-lock.json`, que es un
> JSON plano, ni a `.claude/settings.json`, que son los hooks del proyecto. El efecto colateral fue
> que quien clonara el repo no veía **ninguna** skill instalada ni ningún guardrail: toda la
> evidencia del proceso AI-first vivía solo en la máquina de Renzo, y la rúbrica evalúa el repo.
> Desde esta fecha se versionan `skills-lock.json`, `.claude/settings.json` y `.claude/hooks/`; las
> carpetas de skills siguen ignoradas, que es lo que la razón original justificaba. El hook de
> `SessionStart` pasó de una ruta absoluta a `$CLAUDE_PROJECT_DIR` para poder versionarse sin
> romperse en otro clon.

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

## Paso 12 — Revisión de `Tablet_app_structures.pptx` y Hueco 5 (2026-07-30)

Se movió la documentación vigente de `Documentacion 21 07/` a `30 07/` (nueva carpeta oficial) y se
sumó `Tablet_app_structures.pptx`: 5 variantes de navegación completa para la app de tablet (1A-1E,
más login 1F), derivadas de `Design.md`.

Al revisar el pptx se detectó un hueco no cubierto ni ahí ni en `Design.md`: el panel de "Nueva
activación" (variante 1A) solo mostraba el selector Alerta I/II/III — la escala aeronáutica — sin
ningún campo para elegir la categoría de emergencia, pese a que el PRD ya confirmó (2026-07-21) que
Epidemiológica, Estructural/Incidentes y MATPEL usan escalas propias y distintas.

Resuelto: se agrega un selector de **categoría de emergencia** (Aeronáutica/Epidemiológica/
Estructural-Incidente/MATPEL, preseleccionada en Aeronáutica) como primer campo del panel de
activación, que determina cuál selector de escala se muestra debajo. Actualizado en los 4 documentos:

- `Design.md` — Flujo A ampliado con el nuevo selector; agregado como "Hueco de diseño —
  2026-07-30" en la sección de huecos.
- `TECH-DESIGN.md` — criterio de aceptación de Activación ampliado para reflejar el selector (el
  campo `tipo de emergencia` ya existía en el modelo de datos de `Activacion`, no fue necesario
  agregar una entidad nueva).
- `PRD_PCE_JorgeChavez.3.md` y `.docx` — nota agregada a la sección 6 (edición del `.docx` vía Word
  COM, sincronizada con el `.md`).
- `Tablet_app_structures.pptx` — diapositiva 2 (Opción 1A) editada vía PowerPoint COM: se insertó el
  selector (label + campo tipo dropdown "Aeronáutica ▾") antes del selector de Alerta, corriendo el
  resto del panel hacia abajo y agrandando el marco del mockup para que no se corte; diapositiva 8
  ("Próximos pasos") ampliada con un cuarto punto para confirmar con Renzo si el campo nuevo sigue
  cumpliendo el límite de 3 clics.

**Confirmado (2026-07-30):** el selector de categoría no agrega clics de navegación — el límite de
3 clics del PRD (sección 7) mide profundidad de navegación para llegar a una función, y el selector
se agrega dentro de la misma pantalla de activación ya alcanzable, no como pantalla o paso nuevo.
Actualizado en `Design.md`, `Tablet_app_structures.pptx` (diapositiva 8) y esta bitácora.

## Paso 13 — `FRONTEND-SPEC.md` + `FRONTEND-TASKS.md` (2026-07-30)

Con el backend ya implementado y verificado, se armó la especificación del frontend (Cliente PMM +
Cliente COE) leyendo el código real del backend (`app/models`, `app/schemas`, `app/routers`) en vez
de asumir el contrato desde `TECH-DESIGN.md` solo — esto expuso 4 huecos entre lo documentado y lo
implementado:

- `RelevoMando` no tiene `activacion_id` en el modelo real, pese a que `TECH-DESIGN.md` la describe
  con "activación asociada" — "Cadena de mando" no puede filtrar por incidente hasta corregirlo.
- No hay endpoint que exponga `LogAuditoria` — se resolvió como decisión de diseño (no agregar uno;
  construir el feed de "últimos eventos" del Resumen COE combinando los endpoints de dominio ya
  consumidos) en vez de dejarlo como hueco abierto.
- No hay endpoint para cambiar `Activacion.estado` a `cerrada` — bloquea el botón "Desactivar".
- El mecanismo de "token blando" (ADR-7) no tiene resuelto qué pasa si el JWT ya expiró al momento
  de reconectar y reenviar la cola offline — el backend valida el JWT de cada request sin excepción.

`FRONTEND-SPEC.md` documenta el contrato real endpoint por endpoint (incluidos los valores exactos
de `clasificacion_origen` por categoría, que ya estaban implementados server-side coincidiendo con
el hueco de diseño resuelto en el Paso 12), qué pantalla consume qué dato, y qué queda fuera de
alcance. `FRONTEND-TASKS.md` desglosa el trabajo en 6 fases, con los 4 huecos de arriba y la
decisión pendiente de shell de navegación (1A-1E, pptx) marcados explícitamente como bloqueantes de
esa tarea puntual (no del resto del frontend).

## Paso 14 — Cierre de 2 huecos de backend detectados en el Paso 13 (2026-07-30)

De los 4 huecos de `FRONTEND-SPEC.md`, se resolvieron los 2 que eran puro código (no requerían
decisión de Renzo ni del Jefe de Rescate):

- **`RelevoMando.activacion_id`:** agregado al modelo. La migración 0001 delega en
  `Base.metadata.create_all()` (documentado en su propio docstring como espejo vivo de los modelos,
  no DDL congelado), así que ya crea la tabla con la columna incluida — la migración nueva
  (`0003_relevo_activacion_y_cierre`) no necesita un `ADD COLUMN` para esto (intentarlo daba
  `DuplicateColumnError`, detectado corriendo la migración contra Postgres real). `GET
  /relevos-mando` ahora acepta `?activacion_id=` opcional.
- **Cierre de activación:** `POST /activaciones/{id}/desactivar`, restringido a
  `ROLES_DESACTIVACION` (Gerente de Seguridad, Gerente de Operaciones Aeroportuarias, Duty Manager —
  el Coordinador del Plan de Emergencia y sus suplentes, PRD sección 5, no el CI). Como `Activacion`
  es insert-only (ADR-2) con un trigger de DB que antes bloqueaba cualquier UPDATE sin excepción, se
  reemplazó ese trigger por uno dedicado que permite **únicamente** la transición `activa -> cerrada`
  (verifica que ningún otro campo cambie en el mismo UPDATE) — preserva la intención real del ADR
  ("sin edición retroactiva no auditada") sin bloquear esta acción legítima, que además ahora queda
  auditada (`app/db/audit.py` escucha `after_update` de `Activacion`).

**Bug real encontrado y corregido al verificar contra Postgres:** el primer trigger escrito comparaba
`OLD.estado = 'activa'` (minúsculas, el `.value` del enum de Python que usa la API JSON) y fallaba
con "invalid input syntax for enum" — SQLAlchemy guarda el **nombre** del enum (`'ACTIVA'`,
mayúsculas), no su `.value`. Se corrigió comparando contra `'ACTIVA'`/`'CERRADA'` y se verificó
consultando `pg_enum` directamente para confirmar los labels reales antes de asumir nada.

Verificación: `alembic upgrade head` / `downgrade -1` / `upgrade head` de nuevo sin error, y 14/14
tests (9 existentes + 5 nuevos: `test_relevos_mando.py`, `test_desactivar_activacion.py`) contra
PostgreSQL 16 real. Actualizado en `FRONTEND-SPEC.md`, `FRONTEND-TASKS.md`, `TECH-DESIGN.md`, ADR-2 y
`backend/README.md`.

Quedan 2 huecos de los 4 originales: 6.2 (decisión ya tomada, no bloquea nada) y 6.4 (mecanismo de
sync con token vencido — sigue pendiente de decidir con Renzo).

Todo lo anterior (Pasos 12-14: documentos + código de backend + migración + tests nuevos) quedó
commiteado el 2026-07-30 en `9698419` ("Especificar frontend PMM/COE y cerrar huecos de backend
detectados al escribirla").

## Paso 15 — Decisión de la variante de navegación (2026-07-30)

De los ítems bloqueados de `FRONTEND-TASKS.md` Fase 0, se resolvió el primero: Renzo revisó las 5
variantes de `Tablet_app_structures.pptx` (exportadas a PNG vía PowerPoint COM para poder verlas) y
eligió la **Opción 1A — tabs inferiores + acciones flotantes**: barra de tabs fija abajo, con Relevo
de mando y Desactivar como botones flotantes siempre a mano; en portrait la barra de tabs se
comprime con scroll horizontal.

Actualizado en `FRONTEND-TASKS.md`: el ítem de Fase 0 marcado como resuelto, y las referencias al
"shell provisional" en Fase 2 y Fase 4 reemplazadas por la referencia directa a 1A (ya no hace falta
un shell provisional de reemplazo).

## Paso 16 — Arranque del frontend con Spec-Driven Development (2026-08-10)

Se instaló el skill `spec-driven-development` (`addyosmani/agent-skills`) y se armó `BACKLOG.md`
(raíz del repo) con los 11 ítems del frontend derivados de `FRONTEND-SPEC.md`/`FRONTEND-TASKS.md`,
cada uno pensado como un ciclo SDD independiente (Specify→Plan→Tasks→Implement, gate humano entre
fases). Ítem #1 (Setup compartido) completado: monorepo `frontend/` (npm workspaces, apps
`coe`/`pmm`, paquete `@pce/api-client`), tipos TS espejo de los schemas Pydantic, cliente HTTP
tipado, store de sesión, login compartido — Tailwind v4 + tokens del design system Stitch
("Sentinel Command"), 9 tests (Vitest + RTL + MSW). `CLAUDE.md` agregado a la raíz del repo como
contexto persistente. Detalle completo en `tasks/item-01-setup/`.

## Paso 17 — Ítem #2: Shell de navegación Cliente COE, Opción 1A (2026-08-10)

Segundo ciclo SDD, con `tasks/` reorganizado en subcarpetas por ítem (`tasks/item-01-setup/`,
`tasks/item-02-shell-navegacion/`) para no perder las decisiones de cada ciclo anterior. Specify
confirmó dos bifurcaciones reales: routing con React Router (URLs reales por tab, no estado local)
y las acciones flotantes se ocultan por completo (no deshabilitadas) para roles sin permiso.

Implementado: React Router 8.3.0 + Radix UI (`Tabs`, `DropdownMenu` — primer uso real de Radix en
el repo) sobre las 5 pantallas principales (Resumen, Mapa, Unidades, Comunicaciones, Cadena de
mando, todas *stub*), acciones flotantes Relevo/Desactivar gateadas por rol (roles copiados
literal de `backend/app/deps.py`), y menú aparte para Pre-PAI/Reportes (`Design.md` Flujo B,
Hueco 2). 7 tests (Vitest + RTL), con TDD real confirmado en el gating por rol (roto a propósito →
2/3 tests fallaron → revertido → 3/3 pasan).

Dos hallazgos reales durante la verificación, ninguno de lógica de negocio propia:

- **jsdom + data router de React Router 8**: cualquier `navigate()` con `RouterProvider` sobre
  `jsdom` tira `TypeError: RequestInit: Expected signal... to be an instance of AbortSignal` — el
  data router arma un `Request` interno en cada navegación, y jsdom instala su propia clase
  `AbortSignal` (para el "abortable fetch" del spec DOM) que `undici` no reconoce como la suya.
  Fix: `happy-dom` como entorno de test de `apps/coe` en vez de `jsdom` (`packages/api-client`
  sigue con `jsdom` sin problema, no navega).
- **`lang="en"` en ambos `index.html` con contenido 100% en español**: Chrome traducía la UI en
  vivo (se vio "Informes" en vez de "Reportes" en pantalla, aunque el DOM real ya decía
  "Reportes" — confirmado leyendo `textContent`). Corregido `lang="es"` en `apps/coe/index.html` y
  `apps/pmm/index.html`.

Verificación manual real en navegador (no solo tests): clics reales en las 5 tabs y el menú
aparte, deep-link directo a `/mapa`, y compresión de la barra de tabs con scroll horizontal en
viewport angosto (`scrollWidth` > `clientWidth`, las 5 tabs siguen en el DOM, ninguna recortada).

Ítem #2 cerrado. `BACKLOG.md` y `CLAUDE.md` actualizados. Siguiente: ítem #3 (Cliente COE —
Resumen y Cadena de mando).

## Paso 18 — Ítem #3: Resumen y Cadena de mando, cierre de verificación (2026-08-11)

El código y los tests del ítem #3 (`ResumenScreen`, `CadenaDeMandoScreen`, `usePolling`,
`lib/activacionActual.ts`, `lib/ultimosEventos.ts`, 5 tipos TS nuevos) se habían completado en la
sesión anterior, con un hallazgo real ya corregido ahí (falta de `CORSMiddleware` en el backend,
detectado al probar `fetch()` desde `apps/coe` en navegador). Quedaba pendiente la checklist final
de cierre, retomada en esta sesión:

- Postgres 16 (servicio `postgresql-x64-16`) ya corría; `alembic upgrade head` confirmó la base ya
  al día (`0003_relevo_activacion_y_cierre`).
- Backend reiniciado (`uvicorn app.main:app --port 8000`) para tomar el `CORSMiddleware` agregado
  en la sesión previa — confirmado con un `OPTIONS` manual que el preflight responde
  `access-control-allow-origin` para `localhost:5173`.
- `npm run test/lint/build --workspace=coe`: 17/17 tests, lint y build limpios.
- Verificación manual en navegador (Chrome vía `claude-in-chrome`) contra la activación de prueba
  real ya presente en Postgres (`test_duty`/`test1234`, "Incendio de prueba E2E"): login,
  Resumen con alerta/cronómetro corriendo/convocatoria, polling cada 3s confirmado por
  `read_network_requests` (3 ciclos de los 5 endpoints). **Hallazgo no bloqueante**: los botones
  "Relevo de mando"/"Desactivar" del shell (ítem #2) son solo UI sin `onClick` — su lógica es el
  ítem #6, todavía no implementado. Para probar el caso "sin activación activa → redirige a Cadena
  de mando" se desactivó la activación directo por API (`POST
  /activaciones/{id}/desactivar`), no por el botón; confirmado el redirect con los 2 carriles
  COE/PMM.

Ítem #3 cerrado. `BACKLOG.md`, `CLAUDE.md` y `tasks/item-03-resumen-cadena-mando/todo.md`
actualizados. Siguiente: ítem #4 (Cliente COE — Mapa y Unidades).

## Paso 19 — Ítem #4: Mapa y Unidades (2026-08-11)

Pregunta abierta real heredada de `BACKLOG.md`/`FRONTEND-SPEC.md`: si el COE puede editar el
estado de una unidad desde su propia pantalla, o es solo lectura ahí (sin definir en `Design.md`).
Confirmado con el usuario: **sí, editable desde COE** — el backend ya lo soportaba sin cambios
(`PUT /unidades/{id}` no distingue quién actualiza). Actualizado `FRONTEND-SPEC.md` y
`BACKLOG.md` con la decisión antes de arrancar el ciclo.

**El skill `spec-driven-development` no apareció disponible en esta sesión** (invocada desde
`/proyecto` con working directory `C:\Users\ASUS`, fuera de esta carpeta — el descubrimiento de
skills de proyecto depende de la raíz real de la sesión, no solo de que el símlink exista en
disco). Se siguió el mismo proceso a mano: Specify (`spec.md`) → gate humano → Plan (`plan.md`) →
Tasks (`todo.md`) → Implement, con la misma estructura y rigor que los ciclos anteriores.

Implementado: `MapaScreen.tsx` (marcadores vía `GET /marcadores-incidente`, filtrados
client-side por el `activacion_id` de la activación en curso — mismo patrón que `ResumenScreen`
del ítem #3; toggle de capas Cuadrícula/Incidente/Accesos, capa "Unidades" visible pero
deshabilitada, fase 2 fuera de alcance) y `UnidadesScreen.tsx` (lista de `GET /unidades` con
`<select>` de estado por unidad, `onChange` dispara `PUT /unidades/{id}`). Tipos nuevos
`EstadoUnidad`/`Unidad` en `@pce/api-client`. 4 tests nuevos (21 en total en `coe`).

**Hallazgo real durante `verify`**: `apps/coe/src/mocks/server.ts` no tenía un handler MSW por
defecto para `GET /unidades` (sí para los demás endpoints) — al montar `UnidadesScreen` sin
querer desde `TabBar.test.tsx` (que navega por todas las tabs), MSW tiraba "intercepted a request
without a matching request handler". Agregado el handler por defecto, mismo patrón que los
demás.

Verificación manual real en navegador contra backend real: activación de prueba nueva + un
marcador en capa "incidente" + unidad `R1`. Confirmado el filtro por activación, el toggle de
capas ocultando/mostrando el marcador, y que cambiar el estado de `R1` desde el `<select>`
persiste (confirmado recargando la página).

Ítem #4 cerrado. `BACKLOG.md`, `CLAUDE.md`, `FRONTEND-SPEC.md` y
`tasks/item-04-mapa-unidades/todo.md` actualizados. Siguiente: ítem #5 (Cliente COE — Pre-PAI,
Reportes y Comunicaciones).

## Paso 20 — Ítem #5: Pre-PAI, Reportes y Comunicaciones (2026-08-11)

Dos preguntas abiertas reales de `BACKLOG.md`/`FRONTEND-SPEC.md` confirmadas con el usuario antes
de arrancar la spec:

1. **Comunicaciones**: queda como placeholder sin funcionalidad — sin entidad de datos definida,
   se define en otro momento (sin cambios sobre el stub del ítem #2).
2. **"Activar" un Pre-PAI**: en el Cliente COE (este ítem) la pantalla es de solo lectura —
   listar + ver detalle. La precarga real hacia el formulario de evaluación inicial es el ítem #9
   (Cliente PMM), la única pantalla donde ese formulario existe hoy (confirmado leyendo
   `FRONTEND-SPEC.md` sección 5 — el formulario de evaluación inicial está documentado solo del
   lado PMM).

`FRONTEND-SPEC.md` y `BACKLOG.md` actualizados con ambas decisiones antes de la spec.

Implementado: `PrePAIScreen.tsx` (`GET /pre-pai`, lista + detalle al seleccionar) y
`ReportesScreen.tsx` (`GET /activaciones` filtrado client-side por `estado === "cerrada"`, botón
"Ver reporte" por activación que dispara `POST /reportes-cierre` — idempotente, así que no hace
falta un `GET` de listado que no existe — y muestra `datos` como lista clave/valor genérica, con
`JSON.stringify` para los arrays anidados). Tipos nuevos `PrePAI`/`ReporteCierre` en
`@pce/api-client`. 2 tests nuevos (23 en total en `coe`).

**Hallazgo real durante `verify`**: mismo patrón que el ítem #4 — faltaba el handler MSW por
defecto de `GET /pre-pai` en `apps/coe/src/mocks/server.ts` (contaminaba `MenuAparte.test.tsx`,
que navega a `/pre-pai`). Agregado, mismo criterio que los demás endpoints.

Verificación manual real en navegador contra backend real: Pre-PAI de prueba creado por API,
visible en la lista con su detalle completo; Reportes mostró solo la activación cerrada real de
sesiones anteriores, ocultando la activa, y generó/mostró su reporte correctamente (incluidos los
arrays vacíos). Nota aparte, no bug de este ítem: el JWT de sesión expiró a los 30 min entre la
verificación del ítem #4 y esta — es exactamente el hueco 6.4 ya documentado (sync/refresh con
token vencido, pendiente de confirmar con Renzo), no algo nuevo.

Ítem #5 cerrado. `BACKLOG.md`, `CLAUDE.md`, `FRONTEND-SPEC.md` y
`tasks/item-05-pre-pai-reportes-comunicaciones/todo.md` actualizados. Siguiente: ítem #6 (Relevo
de mando y Desactivar — acciones reales de los botones del shell, hoy solo UI sin `onClick`).

## Paso 21 — Ítem #6: Relevo de mando y Desactivar (2026-08-11)

Último ítem del Cliente COE. Conecta los botones de `FloatingActions` (ítem #2, ya gateados por
rol) a acciones reales. Nueva dependencia: `@radix-ui/react-dialog` (primer uso de `Dialog` en el
repo, mismo criterio que `Tabs`/`DropdownMenu` del ítem #2).

Implementado: `RelevoModal.tsx` y `DesactivarModal.tsx`, ambos resolviendo la activación en curso
al abrirse (`GET /activaciones` + `activacionActual`, ítem #3) en vez de recibirla por props —
los botones son globales y no saben en qué pantalla está el usuario. Relevo: formulario
`instancia`/`responsable_saliente`/`responsable_entrante` → `POST /relevos-mando`. Desactivar:
confirmación dentro del propio modal (no `window.confirm` nativo — decisión propia, no
documentada en `FRONTEND-SPEC.md`, para evitar cerrar una emergencia real por mal click) → `POST
/activaciones/{id}/desactivar`. 5 tests nuevos (28 en total en `coe`): 2 de `RelevoModal`, 1 de
`DesactivarModal`, 2 agregados a `FloatingActions.test.tsx` (sin romper los 3 existentes, que
verifican gateo por rol sin red).

Verificación manual real en navegador contra backend real, con la activación activa del ítem #4
todavía abierta: registrar un relevo (Capitán Rojas → Capitán Vega) y confirmarlo visible en
Cadena de mando; desactivar esa misma activación y confirmar por API que quedó `estado: "cerrada"`,
y que `/resumen` redirige a `/cadena-de-mando` (comportamiento ya construido en el ítem #3, sin
tocar). Hallazgo cosmético no bloqueante: los `<input>` de texto del modal de Relevo no tienen
borde visible contra el fondo oscuro hasta hacer foco — ajuste de estilos pendiente para otro
momento, no afecta la funcionalidad.

**Ítem #6 cerrado — el Cliente COE queda completo en su alcance actual** (ítems #1-#6, todos
verificados end-to-end contra backend real). `BACKLOG.md`, `CLAUDE.md` y
`tasks/item-06-relevo-desactivar/todo.md` actualizados. Siguiente: arrancar el Cliente PMM
(ítems #7-#10), el trabajo offline-first — la parte más grande y menos avanzada del backlog.

## Paso 22 — Ítem #7: Cliente PMM, Setup PWA y login offline (2026-08-11)

Primer ítem del Cliente PMM. `apps/pmm` existía desde el ítem #1 (scaffold, Tailwind + tokens,
`Login` compartido) pero sin tooling de test propio — Vitest/RTL/MSW solo se habían agregado a
`coe`. Este ítem agrega ese tooling a `pmm` (mismo `vitest.config.ts`/`test-setup.ts`/
`mocks/server.ts` que `coe`, con `happy-dom`) y arranca el PWA propiamente dicho.

Implementado: `vite-plugin-pwa` con `registerType: "prompt"` (ADR-4 — nunca `"autoUpdate"`
silencioso, siempre avisar); `ActualizacionDisponible.tsx` (usa `useRegisterSW` de
`virtual:pwa-register/react`, aviso + botón "Reiniciar para aplicar" cuando hay `needRefresh`);
`App.tsx` gatea por `getToken()` (mismo patrón que `coe`, ítem #1) — sin sesión, `Login`; con
sesión, un placeholder simple ("Sesión iniciada", sin pantallas reales todavía, esas son los
ítems #8-#10).

**Dos hallazgos reales durante la implementación/`verify`:**

- `vite-plugin-pwa` también hay que agregarlo al `vitest.config.ts` de `pmm`, no solo al
  `vite.config.ts` de producción — sin el plugin ahí, Vite no resuelve el módulo virtual
  `"virtual:pwa-register/react"` y el import falla en el análisis de imports antes de que
  `vi.mock(...)` llegue a interceptarlo. Se agregó `VitePWA({ registerType: "prompt" })` también
  en `vitest.config.ts`.
- `ActualizacionDisponible` se decidió montar **siempre** en `App.tsx`, no solo en la rama
  post-login como se había planeado en `plan.md` — es la que dispara `useRegisterSW`, y el shell
  de la app debe cachearse desde antes del primer login para que la propia pantalla de `Login`
  pueda recargar sin conexión (si solo se registraba post-login, un usuario que nunca inició
  sesión con conectividad no tendría el SW activo la primera vez que la necesite offline).

Verificación manual real: `vite build --workspace=pmm && vite preview --port 4173`. Confirmado en
`navigator.serviceWorker.getRegistrations()` que el SW quedó `"activated"` en
`http://localhost:4173/sw.js`. Con un JWT real (`test_duty`) inyectado directo en
`localStorage["pce.session.token"]`, recargar mostró "Sesión iniciada" sin pasar por el login, y
`read_network_requests` confirmó que ninguna request fue a `localhost:8000` — solo assets
estáticos servidos por el propio `vite preview`.

Ítem #7 cerrado. `BACKLOG.md`, `CLAUDE.md` y `tasks/item-07-pwa-login-offline/todo.md`
actualizados. Siguiente: ítem #8 (Cliente PMM — Nueva activación), la primera pantalla real del
Cliente PMM — recién ahí hace falta armar un router para `pmm` (hoy no tiene ninguno).

## Confirmación externa — Criterio de convocatoria MATPEL (2026-08-11)

Antes de arrancar el ítem #8: el Jefe de Rescate confirmó el criterio que `TECH-DESIGN.md` tenía
marcado como `[Propuesto, pendiente de confirmar]` — la convocatoria automática de MATPEL es
**siempre "activación general"**, sin escala diferenciada por clase UN (no hay datos reales de
incidentes MATPEL de donde derivar una escala, PRD sección 10). Es el criterio definitivo, no un
supuesto. Actualizado `TECH-DESIGN.md` (Modelo de datos → `Activacion`, y sacada la entrada de
"Riesgos técnicos abiertos"), `BACKLOG.md` (ítem #8, columna "Contexto extra requerido" vacía) y
`CLAUDE.md` (sección "Pendientes externos"). Quedan 2 pendientes externos, ambos de Renzo: ventana
de 12h del token blando (ADR-7) y mecanismo de sync con token vencido (hueco 6.4).

## Paso 23 — Ítem #8: Cliente PMM, Nueva activación (2026-08-11)

Primera pantalla real del Cliente PMM. Sin router todavía: `App.tsx` reemplaza el placeholder del
ítem #7 directo por `<NuevaActivacionScreen />` (una sola pantalla real no justifica un router —
se arma cuando el ítem #9 agregue una segunda).

Implementado: `lib/payloadActivacion.ts` (función pura que arma el `ActivacionCreate` exacto por
categoría — Aeronáutica lleva `nivel_alerta`/`tipo_alerta` y nunca `clasificacion_origen`, el
resto de categorías al revés, con los valores exactos de `clasificacion_origen` copiados literal
de `FRONTEND-SPEC.md` sección 2: `EMERGENCIA`/`URGENCIA`/`CONSULTA`, `Estructural`/`Incidente`,
`Clase 1`…`Clase 9`); `NuevaActivacionScreen.tsx` (selector de categoría → campos dependientes →
tipo de incidente → aviso informativo de convocatoria → `POST /activaciones` con `id`
generado por `crypto.randomUUID()` y `hora_evento` automático → confirmación con la convocatoria
de la respuesta). También se agregó `apps/pmm/src/apiClient.ts` (mismo patrón que `apps/coe`, no
existía — `App.tsx` creaba el cliente HTTP inline desde el ítem #1). 6 tests nuevos (10 en total
en `pmm`, sumando los 4 del ítem #7).

Verificación manual real contra backend real (`vite dev`, puerto 5174 porque `coe` seguía
ocupando el 5173): creada una activación Aeronáutica ("Verificación Item 8 - Aeronáutica", nivel
I) y una MATPEL ("Verificación Item 8 - MATPEL", Clase 3) reales desde el formulario, ambas
confirmadas por la pantalla de éxito. Las dos mostraron "Convocados: 0" — no se investigó a fondo
por decisión explícita del usuario (interrumpió un comando de diagnóstico y pidió seguir sin
esa investigación); la hipótesis más probable es que la base de test solo tiene el usuario
`test_duty`/`duty_manager`, sin los roles operativos (Jefe de Rescate, Sup. Gral. de Rescate,
etc.) que el backend convocaría automáticamente — no bloquea el cierre porque lo que este ítem
debía verificar (el payload exacto por categoría) quedó confirmado en ambos casos reales.
Hallazgo menor no bloqueante: el formulario no resetea sus campos al volver a "Nueva activación"
desde la confirmación (cosmético).

Ítem #8 cerrado. `BACKLOG.md`, `CLAUDE.md` y `tasks/item-08-nueva-activacion/todo.md`
actualizados. Siguiente: ítem #9 (Cliente PMM — Evaluación inicial y Marcador de incidente) —
recién ahí hace falta armar un router para `pmm` (2+ pantallas reales).

## Paso 24 — Ítem #9: Cliente PMM, Evaluación inicial y Marcador de incidente (2026-08-11)

Segunda y tercera pantalla real del Cliente PMM. Primera vez que `pmm` necesita un router: `Shell`
con una nav simple de 3 enlaces, sin la barra de tabs + acciones flotantes de `coe` — `Design.md`
solo documenta Flujo A/B/C/D (todos del dashboard COE o de una sola pantalla), nada específico
para la navegación del PMM de campo. Decisión de bajo riesgo, ajustable sin impacto en datos.

Implementado: `roles.ts` y `lib/activacionActual.ts` copiados de `coe` (mismo criterio de
duplicar en vez de compartir sin un tercer caso de uso, ya aplicado con `apiClient.ts` en el ítem
#8); `EvaluacionInicialScreen.tsx` (magnitud + riesgos secundarios, rol restringido a
`ROLES_EDICION_EVALUACION_RELEVO` — oculta el formulario por completo sin el rol, no lo
deshabilita, mismo criterio que `FloatingActions` de `coe`); `MarcadorIncidenteScreen.tsx`
(coordenada de cuadrícula + tipo de incidente + riesgo + capa, sin restricción de rol). El badge
"sin sincronizar" de Marcador se definió explícitamente como el estado del envío *actual* (visible
mientras la promesa del `POST` no resuelve) — la cola offline persistente real (IndexedDB,
reintento al reconectar) es el ítem #10, que depende de este.

**Hallazgo real durante `verify`**: mismo patrón que los ítems #4/#5 de `coe` — faltaba el handler
MSW por defecto de `GET /activaciones` en `apps/pmm/src/mocks/server.ts` (estaba vacío desde el
ítem #7). Agregado.

Verificación manual real contra backend real, con una de las activaciones activas del ítem #8:
completada una evaluación inicial real y un marcador real desde el formulario, ambos confirmados
por el `POST` 201 y luego por `GET` directo a la API. La extensión de Chrome tuvo fallas
transitorias de CDP durante la sesión (screenshot y `computer:type` dejaron de responder) — se
recuperó usando `form_input` (setea el valor del campo directo, sin simular tipeo) para completar
la verificación sin perder el resultado.

Ítem #9 cerrado. `BACKLOG.md`, `CLAUDE.md` y `tasks/item-09-evaluacion-marcador/todo.md`
actualizados. Siguiente: ítem #10 (Cliente PMM — Cola offline y token blando), el ítem más
complejo del backlog (IndexedDB, reintento, token blando ADR-7) — depende de este y del ítem #6.

## Paso 25 — Confirmación de Renzo: ventana del token blando y hueco 6.4 (2026-08-12)

Últimos 2 `[Propuesto]` del proyecto, ambos condicionaban el alcance del ítem #10:

- Ventana máxima de sesión offline del token blando (ADR-7): confirmada en **24h** (no las 12h
  propuestas por defecto).
- Reconciliación con JWT vencido al reconectar (hueco 6.4, `FRONTEND-SPEC.md`): confirmado
  re-login forzado al detectar reconexión con token vencido — sin endpoint especial de backend. La
  cola offline en IndexedDB se conserva intacta y sincroniza automáticamente contra el mismo POST
  idempotente en cuanto hay sesión válida.

Actualizado `TECH-DESIGN.md` (Riesgos técnicos abiertos), `FRONTEND-SPEC.md` (sección 5 y hueco
6.4), `BACKLOG.md` (ítem #10) y `CLAUDE.md` (Pendientes externos). No queda ningún `[Propuesto]`
abierto en el proyecto. Ítem #10 desbloqueado.

---

## Estado actual

- PRD vigente: `.3`, en `30 07/` (carpeta oficial desde el 2026-07-30, reemplaza
  `Documentacion 21 07/`). Sin preguntas abiertas de la ronda 21/07; con la nota del selector de
  categoría agregada el 30/07 (Paso 12).
- TDD y los 8 ADRs: revisados adversarialmente, con los 4 Críticos, 6 Advertencias y 2 Sugerencias
  resueltos y documentados en el propio texto de cada ADR.
- Backend FastAPI implementado (commits `53126bc`, `f3ba454`, `9698419`) y verificado end-to-end
  contra PostgreSQL 16 real: migraciones limpias (incluida `0003_relevo_activacion_y_cierre`),
  14/14 tests, servidor sirviendo endpoints autenticados.
- Frontend: `BACKLOG.md` (11 ítems, ciclos SDD independientes) — **ítems #1-#9 cerrados** (Paso 16
  a Paso 24). **Cliente COE completo** (ítems #1-#6, 28 tests en `coe`). **Cliente PMM en curso**:
  ítems #7 (setup PWA + login offline), #8 (Nueva activación) y #9 (Evaluación inicial + Marcador
  de incidente, primer router de `pmm`, 3 pantallas) cerrados, 16 tests en `pmm`. Siguiente: ítem
  #10 (Cliente PMM — Cola offline y token blando), el más complejo del backlog (IndexedDB,
  reintento, token blando ADR-7); ítem #11 (endurecimiento) es lo último. Criterio de convocatoria
  MATPEL confirmado con el Jefe de Rescate 2026-08-11 (siempre "activación general"). Ventana del
  token blando confirmada con Renzo en 24h y hueco 6.4 (sync con token vencido) resuelto con
  re-login forzado + cola intacta, ambos 2026-08-12 (Paso 25) — ya no quedan `[Propuesto]`
  abiertos, ítem #10 desbloqueado.
- Repo: al escribir el Paso 24, `main` tenía commits locales sin pushear — ya pusheados
  (`3b41b73`) el 2026-08-12; ver el propio `git status`/`git log origin/main..HEAD` antes de
  asumir el estado del repo.
- Pendientes externos: ninguno. Ver Paso 25 y la sección "Pendientes externos" de `CLAUDE.md`.
