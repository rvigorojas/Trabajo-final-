# ADR 6: Resiliencia — reconciliación de escrituras offline

## Estado

Aceptado

## Contexto

El cliente PMM (ADR 1) encola registros mientras está sin señal en pista y los reconcilia al
reconectar, a través del servicio de sync. El modelo de datos (ADR 2) ya establece que los registros
no se editan retroactivamente, solo se insertan, con auditoría aparte. El riesgo real pendiente es
qué pasa si dos fuentes intentan modificar el mismo estado compartido — por ejemplo, el estado de
una unidad SSEI actualizado tanto desde el PMM como desde el COE — mientras una de ellas estuvo
offline.

## Decisión

Todo registro generado offline por el PMM (evaluación inicial, relevo de mando, marcador de
incidente) se modela como una fila nueva con ID generado en el cliente (UUID) y timestamp del
momento en que ocurrió el evento, nunca como edición de una fila existente. Esto elimina
estructuralmente el conflicto de sync para estos registros. El único caso de estado mutable
compartido que puede generar conflicto real (estado de una unidad SSEI) se resuelve por separado con
last-write-wins por timestamp, dado su bajo riesgo operativo frente al resto de los registros.

## Alternativas consideradas

- **Last-write-wins por timestamp para todo** — simple de implementar de forma uniforme en todos
  los casos. No se eligió como estrategia general porque, aplicada a registros como la evaluación
  inicial o el relevo de mando, podría sobrescribir en silencio un cambio válido hecho por otra
  fuente mientras el PMM estaba offline, violando el requisito de trazabilidad sin edición
  retroactiva no auditada (PRD, sección 7).
- **Rechazar y pedir revisión manual ante cualquier conflicto** — garantizaría que nunca se pierde
  información en silencio. No se eligió como estrategia general porque interrumpiría al Comandante
  de Incidente en un momento de alta carga operativa para resolver conflictos que el diseño
  insert-only ya evita de raíz para la mayoría de los registros.

## Consecuencias

- Para evaluación inicial, relevo de mando y marcador de incidente, el sync nunca necesita lógica de
  resolución de conflictos: son siempre inserciones nuevas, coherente con la auditoría de ADR 2.
- Queda un caso especial (estado de unidad SSEI) que sí puede perder una actualización intermedia
  bajo last-write-wins si dos fuentes lo modifican mientras una está offline — un trade-off aceptado
  explícitamente por ser de bajo riesgo operativo frente a la simplicidad de no construir un
  mecanismo de resolución de conflictos más sofisticado solo para ese campo.
