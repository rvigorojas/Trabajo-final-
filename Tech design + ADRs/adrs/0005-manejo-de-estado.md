# ADR 5: Manejo de estado

## Estado

Aceptado

## Contexto

El cliente PMM (offline-first, ADR 1) escribe localmente y sincroniza después — consistencia
eventual por diseño. El cliente COE, en cambio, está siempre online y el wireframe (flujo B) muestra
un dashboard que se actualiza en vivo: cronómetro de alerta, línea de tiempo de eventos y contador
de convocados. Falta decidir cómo el cliente COE se entera de cambios generados por otras fuentes
(el CI en el PMM, la reconciliación del servicio de sync) sin que esas fuentes tengan que empujar
activamente cada actualización.

## Decisión

El cliente COE consulta el backend mediante polling periódico sobre los mismos endpoints REST ya
definidos (ADR 3), con un intervalo de 5 segundos para las vistas activas del dashboard (línea de
tiempo, convocatoria, estado de unidades).

## Alternativas consideradas

- **Server-Sent Events (SSE)** — el backend empujaría actualizaciones por un canal unidireccional
  sobre HTTP, con reacción casi instantánea. No se eligió porque suma una pieza de infraestructura y
  un modelo de conexión persistente (reconexión, keep-alive) que el polling evita, y el intervalo de
  refresco del polling es aceptable frente al ritmo real de eventos de una emergencia (no es un
  sistema de trading de alta frecuencia).
- **WebSocket** — canal bidireccional persistente, más flexible si una fase futura necesita enviar
  datos de alta frecuencia desde el COE (ej. posición en vivo de unidades). No se eligió porque hoy
  el COE solo necesita leer, y la complejidad de manejo de conexión/reconexión de WebSocket no se
  justifica para un canal unidireccional.

## Consecuencias

- El polling reutiliza el mismo contrato REST (ADR 3) sin infraestructura adicional, y es simple de
  implementar y depurar.
- Introduce una latencia de hasta el intervalo de polling entre que ocurre un evento (ej. un relevo
  de mando registrado desde el PMM) y que el COE lo ve reflejado, y genera requests periódicos al
  backend incluso cuando no hay cambios — un costo aceptado explícitamente frente a la simplicidad.
