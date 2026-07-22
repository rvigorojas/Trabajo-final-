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
(ADR 1) genera parte de estos registros offline y los sincroniza al reconectar.

## Decisión

Modelo relacional normalizado: tablas separadas para Activación, ConvocatoriaMiembro,
EvaluacionInicial, RelevoMando, Unidad, MarcadorIncidente, PrePAI y ReporteCierre, cada una con
campos `created_at`/`created_by`, más una tabla de log de auditoría aparte que registra todo cambio
de estado relevante.

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
- La garantía de "sin edición retroactiva no auditada" no la impone el modelo por sí solo: debe
  reforzarse por convención en la capa de aplicación (o triggers de base de datos) que bloqueen
  UPDATE/DELETE directos sobre los registros ya confirmados y solo permitan inserciones en la tabla
  de log de auditoría.
