# Design.md — PCE (Puesto de Comando y Administración de Emergencias)

Basado en `wireflame 0.1.pptx` (borrador para revisión, 17 de julio 2026 — "estructura, no estilo
final"). De las 3 variantes exploradas por flujo, se documenta acá solo la variante elegida por
Renzo para cada uno, como el diseño de referencia para la implementación.

## Flujo A — Activación de emergencia (Alerta I/II/III)

**Variante elegida: 1c — Panel dividido COE / PMM**

- **Selector de categoría de emergencia** (Aeronáutica / Epidemiológica / Estructural-Incidente /
  MATPEL) como primer campo, antes del selector de escala — resuelto en Hueco 5: el selector de
  escala que aparece debajo cambia según la categoría elegida (Alerta I/II/III para Aeronáutica;
  triaje EMERGENCIA/URGENCIA/CONSULTA para Epidemiológica; Estructural/Incidente para esa categoría;
  Clasificación MATPEL de 9 categorías para MATPEL). Aeronáutica queda preseleccionada por defecto,
  por ser la categoría más frecuente, para no sumar fricción al caso más común.
- Selector de nivel/escala de activación (depende de la categoría elegida, ver arriba) en la parte
  superior.
- **Campo de tipo de incidente** (ej. "Advertencia de aeronave") junto al nivel de alerta —
  resuelto: se captura acá, la magnitud y los riesgos secundarios quedan para la evaluación inicial
  posterior del CI (ver Flujo B).
- Panel dividido en dos columnas:
  - **COE**: Gerente de Seguridad, Gerente Operaciones, Duty Manager.
  - **PMM**: Jefe de Rescate (CI), Sup. Gral. Rescate, Supervisor Rescate.
- Hora de activación autogenerada (no editable manualmente).
- Botón único "Registrar activación".

**Datos que implica:** `Activacion` (categoría de emergencia, nivel de alerta/escala, tipo de
incidente, hora auto), `ConvocatoriaMiembro` por cada persona listada en cada columna (instancia
COE/PMM, rol, activación asociada).

## Flujo B — Vista COE (Sala de Crisis)

**Variante elegida: 1f — Tabs superiores por capa**

- Pestañas horizontales: **Resumen / Mapa / Unidades / Comunicaciones**.
- **Acceso aparte para Pre-PAI y Reportes** — resuelto: no van como pestaña de la barra principal,
  sino en un menú/ícono separado en el header (ej. botón "Más"), para no cargar la barra de tabs
  usada en el manejo en vivo de la emergencia.
- **Pestaña dedicada "Cadena de mando"** (resuelto en Hueco 4) — historial completo de relevos de
  COE y PMM/CI, formato de doble carril (como la variante 1k descartada).
- Encabezado persistente: nivel de alerta activo, cronómetro desde la activación.
- Acciones rápidas siempre visibles: **Relevo de mando** (tarjeta rápida, Flujo D), **Desactivar**.
- Tab "Resumen" muestra: evaluación inicial (tipo heredado de la activación, magnitud, riesgos),
  estado de convocatoria (COE X/3, PMM X/3), últimos eventos (log corto tipo feed).

**Navegación completa de la vista COE:** tabs (Resumen / Mapa / Unidades / Comunicaciones / Cadena
de mando) + menú aparte (Pre-PAI, Reportes) + acciones rápidas persistentes (Relevo, Desactivar).

**Datos que implica:** `EvaluacionInicial` (magnitud, riesgos — el tipo ya viene de `Activacion`),
agregación de `ConvocatoriaMiembro` confirmados vs. totales por instancia, feed de `LogAuditoria`
reciente, listado histórico de `RelevoMando` para la pestaña Cadena de mando.

## Flujo C — Mapa geoespacial (marcador de incidente)

**Variante elegida: 1i — Mapa con capas activables**

- Mapa con capas activables/desactivables: **Cuadrícula, Incidente, Accesos, Unidades (fase 2)**.
- Controles de zoom.
- Panel de detalle del incidente marcado: tipo, hora, riesgo.
- **Badge de estado offline** (resuelto en Hueco 3) — un indicador pequeño pegado al marcador recién
  creado cuando no hay conexión ("sin sincronizar"), en vez de un banner de pantalla completa;
  desaparece automáticamente al confirmarse la sincronización.
- Atribución de mapa base: © OpenStreetMap.

**Datos que implica:** `MarcadorIncidente` (coordenada de cuadrícula, tipo, hora, riesgo, capa a la
que pertenece, estado de sincronización), y una entidad implícita de "capa" o al menos un flag por
tipo de elemento visualizable en el mapa.

## Flujo D — Relevo de mando (COE y PMM/CI)

**Variante elegida: 1l — Tarjeta rápida de 1 acción**

- Tarjeta compacta accesible en 1 clic desde cualquier pantalla del dashboard COE.
- Selector de instancia: **COE** o **PMM**.
- Campos: **Sale** (responsable saliente), **Entra** (responsable entrante).
- Botón "Confirmar".

**Datos que implica:** `RelevoMando` (instancia, saliente, entrante, hora auto, activación
asociada).

## Huecos de diseño — resueltos con Renzo, 2026-07-21

- **Flujo A (1c):** no mostraba tipo/magnitud antes de convocar. Resuelto — se agrega el campo tipo
  de incidente al panel de activación; magnitud y riesgos secundarios quedan para la evaluación
  inicial posterior del CI.
- **Flujo B (1f):** no tenía pestaña de Pre-PAI ni de Reportes/cierre. Resuelto — Pre-PAI y Reportes
  quedan accesibles desde un menú aparte del header (no como pestaña de la barra principal), para no
  cargar la navegación usada en vivo durante la emergencia.
- **Flujo C (1i):** no mostraba el estado offline del marcador. Resuelto — un badge pequeño junto al
  marcador recién creado indica "sin sincronizar" cuando no hay conexión, en vez de un banner de
  pantalla completa.
- **Flujo D (1l):** no tenía vista de historial de relevos. Resuelto — se agrega una pestaña
  dedicada "Cadena de mando" a la vista COE (Flujo B), con el historial completo en formato de doble
  carril.

## Hueco de diseño — detectado y resuelto en sesión de trabajo, 2026-07-30

- **Flujo A (1c):** el panel de "Nueva activación" (tanto en esta descripción como en
  `Tablet_app_structures.pptx`) solo mostraba el selector Alerta I/II/III, la escala aeronáutica —
  sin ningún campo que determine cuál escala aplica para las otras 3 categorías (Epidemiológica,
  Estructural/Incidentes, MATPEL), pese a que el PRD confirmó el 2026-07-21 que cada una usa una
  escala propia y distinta. Resuelto — se agrega un selector de **categoría de emergencia** como
  primer campo del panel de activación, que determina dinámicamente cuál selector de escala se
  muestra debajo (ver Flujo A arriba). **Confirmado, 2026-07-30:** el selector no agrega clics de
  navegación al límite de 3 clics del PRD (sección 7) — se agrega como un campo más dentro de la
  misma pantalla de activación, ya alcanzable en el mismo número de clics que antes; el límite mide
  la profundidad de navegación para llegar a una función, no la cantidad de campos que se completan
  una vez alcanzada la pantalla.
