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

---

## Estado actual

- PRD vigente: `.3`, ahora en `30 07/` (carpeta oficial desde el 2026-07-30, reemplaza
  `Documentacion 21 07/`). Sin preguntas abiertas de la ronda 21/07; con la nota del selector de
  categoría agregada el 30/07 (Paso 12).
- TDD y los 8 ADRs: revisados adversarialmente, con los 4 Críticos, 6 Advertencias y 2 Sugerencias
  resueltos y documentados en el propio texto de cada ADR.
- Backend FastAPI implementado (commits `53126bc`, `f3ba454`) y verificado end-to-end contra
  PostgreSQL 16 real: migraciones limpias, servidor sirviendo endpoints autenticados. Ampliado el
  30/07 (Paso 14, aún sin commit) con la migración `0003_relevo_activacion_y_cierre` — 14/14 tests.
- Repo: `main` sincronizada con `origin/main` hasta `f3ba454`. El traslado a `30 07/` (fuera de
  `git mv`, por eso Git lo ve como borrado + carpeta nueva sin trackear) y todas las ediciones de los
  Pasos 12-14 (documentos + código de backend + migración + tests nuevos) están en el árbol de
  trabajo, **pendientes de commit**.
- Pendientes externos (ninguno bloquea el desarrollo):
  - Respuesta del Jefe de Rescate sobre el criterio real de convocatoria para emergencias MATPEL.
  - Confirmación de Renzo sobre la ventana de 12h del token blando (ADR-7).
  - Confirmación de Renzo sobre el mecanismo de sync con token vencido (hueco 6.4, `FRONTEND-SPEC.md`).
