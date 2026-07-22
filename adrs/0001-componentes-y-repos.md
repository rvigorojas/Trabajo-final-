# ADR 1: División de componentes del sistema

## Estado

Aceptado

## Contexto

El PRD exige acceso desde el PMM (tablet GETAC, en pista, con pérdida de señal confirmada → modo
offline con sincronización diferida para evaluación inicial, relevo de mando y marcador de mapa —
sección 7) y desde el COE (Sala de Crisis, instancia fija). El wireframe (flujo C, variante 1g)
confirma que el estado "SIN SEÑAL — guardado local, sincroniza al reconectar" aplica solo al
cliente PMM; el dashboard COE (flujo B) no muestra ningún estado offline. Mezclar ambos
comportamientos en un solo cliente obliga a cargar lógica offline-first (service worker, cola
local, resolución de conflictos) incluso en pantallas que nunca la necesitan.

## Decisión

El sistema se divide en tres componentes: (1) **cliente PMM** — PWA offline-first para tablet
GETAC, con almacenamiento local y cola de sincronización; (2) **cliente COE** — web app liviana,
siempre online, sin lógica de almacenamiento local; (3) **servicio de sincronización/cola** — pieza
de backend dedicada a recibir, encolar y reconciliar los registros generados offline por el cliente
PMM cuando recupera conectividad, separada del backend/API principal que sirve el resto del
sistema.

## Alternativas consideradas

- **App única responsive (PWA)** — un solo cliente serviría ambos contextos con menos superficies
  de código, pero forzaría la lógica offline-first (service worker, cola, reconciliación) a
  convivir con las pantallas COE que nunca la necesitan, complicando el mantenimiento de una base
  de código que en realidad tiene dos perfiles de uso muy distintos.
- **Dos clientes sin servicio de sync separado** — separar PMM/COE pero dejar la reconciliación
  offline como parte del backend principal habría sido más simple de desplegar (una pieza de
  infraestructura menos), pero mezcla la complejidad de sync (colas, reintentos, resolución de
  conflictos) con la lógica de negocio del backend, dificultando razonar sobre y testear cada una
  por separado.

## Consecuencias

- Cada cliente se optimiza para su contexto real (offline-first solo donde se necesita), y la
  complejidad de sincronización queda aislada y testeable en un solo componente.
- Se suma una pieza de infraestructura adicional a operar y desplegar (el servicio de sync), y se
  requiere definir un contrato claro entre el cliente PMM y ese servicio para el encolado/
  reconciliación de registros offline (evaluación inicial, relevo de mando, marcador de mapa).
