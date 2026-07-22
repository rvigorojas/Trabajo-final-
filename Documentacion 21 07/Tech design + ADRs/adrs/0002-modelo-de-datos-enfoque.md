# ADR 2: Enfoque de modelado de datos

## Estado

Aceptado

## Contexto

El PRD (sección 7) exige que todo registro de activación, evaluación inicial, relevo de mando y
cierre quede con marca de tiempo y responsable, sin edición retroactiva no auditada. El wireframe
confirma las entidades concretas que el sistema debe modelar: Activación (tipo, nivel de alerta,
hora), Convocatoria COE/PMM (miembros convocados), Evaluación inicial (tipo, magnitud, riesgos),
Unidad SSEI (estado OK/F.S./N.A.), Marcador de incidente (cuadrícula, tipo, riesgo, hora), Relevo de
mando (instancia, saliente, entrante, hora) y Línea de tiempo de eventos. Además, el cliente PMM
(ADR 1) genera parte de estos registros offline y los sincroniza al reconectar, contra el módulo de
sincronización del backend.

## Decisión

Modelo relacional normalizado: tablas separadas para Activación, ConvocatoriaMiembro,
EvaluacionInicial, RelevoMando, Unidad, MarcadorIncidente, PrePAI y ReporteCierre, cada una con
campos `created_at`/`created_by`, más una tabla de log de auditoría aparte que registra todo cambio
de estado relevante.

**Doble timestamp (resuelve hueco detectado en revisión adversarial, 2026-07-21):** los registros
que el cliente PMM puede generar offline (evaluación inicial, relevo de mando, marcador de
incidente, activación) guardan dos marcas de tiempo distintas: `hora_evento` (declarada por el
dispositivo, es la que se muestra al usuario porque representa cuándo ocurrió realmente el hecho en
campo — puede tener desfase si el reloj de la tablet está mal calibrado) y `hora_recepcion`
(asignada por el backend al recibir el registro, siempre confiable y monótona). El orden de
auditoría y la resolución de conflictos por last-write-wins de `Unidad` (ADR 6) usan
`hora_recepcion`, nunca `hora_evento` — un reloj de tablet desincronizado no debe poder alterar el
orden real de los eventos en el log de auditoría.

**Mecanismo de "sin edición retroactiva" (resuelve hueco detectado en revisión adversarial,
2026-07-21):** se aplica en dos capas — (1) capa de aplicación: la API REST no expone ningún
endpoint UPDATE/DELETE sobre registros ya confirmados de Activacion, EvaluacionInicial, RelevoMando
o MarcadorIncidente, solo POST de inserción; (2) respaldo a nivel de base de datos: una vez elegido
el motor relacional (ver "Riesgos técnicos abiertos" del TDD), agregar un trigger o regla a nivel de
tabla que rechace UPDATE/DELETE directos sobre esas mismas tablas, como defensa adicional si algo
además de la API llega a tocar la base (ej. un script de mantenimiento mal escrito).

## Alternativas consideradas

- **Event sourcing (append-only)** — satisface la trazabilidad de forma nativa, ya que el estado
  nunca se edita, solo se agregan eventos. No se eligió porque suma complejidad real de
  implementación (proyecciones/vistas de lectura para consultas simples como "estado actual del
  incidente") que no se justifica frente al volumen y complejidad operativa esperados del sistema.
- **Documento por incidente (NoSQL)** — simplificaría la sincronización offline, ya que el
  documento completo del incidente viaja como una unidad. No se eligió porque dificulta reportes y
  analytics que crucen múltiples incidentes — un requisito explícito del PRD (sección 6: exportación
  de reporte de cierre compatible con la estructura de los 4 Excel actuales) — y exige resolver
  conflictos de merge a nivel de documento en vez de a nivel de campo/fila.

## Consecuencias

- Las consultas y reportes (incluida la exportación compatible con los 4 Excel actuales) son
  directas sobre tablas normalizadas, y el modelo es familiar para cualquier desarrollador que se
  sume al proyecto.
- La garantía de "sin edición retroactiva no auditada" no la impone el modelo relacional por sí
  solo — se refuerza con el mecanismo de dos capas descrito arriba (API sin UPDATE/DELETE +
  trigger de base de datos como respaldo).
