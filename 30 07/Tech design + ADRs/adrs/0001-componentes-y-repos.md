# ADR 1: División de componentes del sistema

## Estado

Aceptado (revisado 2026-07-21 — ver nota de cambio al final)

## Contexto

El PRD exige acceso desde el PMM (tablet GETAC, en pista, con pérdida de señal confirmada → modo
offline con sincronización diferida para evaluación inicial, relevo de mando y marcador de mapa —
sección 7) y desde el COE (Sala de Crisis, instancia fija). `Design.md` (Flujo C, variante 1i)
confirma que el badge "sin sincronizar" junto al marcador aplica solo al cliente PMM; el dashboard
COE (Flujo B) no muestra ningún estado offline. Mezclar ambos comportamientos en un solo cliente
obliga a cargar lógica offline-first (service worker, cola local, resolución de conflictos) incluso
en pantallas que nunca la necesitan.

## Decisión

El sistema se divide en tres componentes: (1) **cliente PMM** — PWA offline-first para tablet
GETAC, con almacenamiento local y cola de sincronización; (2) **cliente COE** — web app liviana,
siempre online, sin lógica de almacenamiento local; (3) **backend** — API REST/JSON (FastAPI) que
sirve a ambos clientes y, dentro de sí mismo, expone el endpoint/módulo de sincronización que
recibe, valida y reconcilia los registros generados offline por el cliente PMM al reconectar. La
lógica de sync **no** es un servicio desplegable aparte (ver nota de cambio).

## Alternativas consideradas

- **App única responsive (PWA)** — un solo cliente serviría ambos contextos con menos superficies
  de código, pero forzaría la lógica offline-first (service worker, cola, reconciliación) a
  convivir con las pantallas COE que nunca la necesitan, complicando el mantenimiento de una base
  de código que en realidad tiene dos perfiles de uso muy distintos.
- **Servicio de sync como pieza de infraestructura separada del backend** — aislaría por completo
  la lógica de reconciliación offline, facilitando testearla en un componente propio. Se descartó
  en la revisión de 2026-07-21: con el diseño insert-only de ADR-6 (los registros offline se
  reconcilian como inserciones nuevas por UUID de cliente, sin resolución de conflictos compleja
  salvo el caso aparte de `Unidad`), esa lógica es lo bastante simple como para no justificar un
  componente desplegable adicional frente al costo de operarlo con un equipo de 1-3 personas (ADR
  4, ADR 8).

## Consecuencias

- Cada cliente se optimiza para su contexto real (offline-first solo donde se necesita).
- La lógica de sync vive dentro del mismo backend que el resto de la API, como módulo/router
  propio — se pierde el aislamiento total de desplegar esa lógica aparte, pero se gana un
  componente menos que operar, versionar y desplegar, relevante para un equipo chico (ADR 4).

## Nota de cambio (2026-07-21)

La versión original de este ADR definía un **servicio de sincronización/cola separado** del
backend/API principal, como cuarto componente desplegable. Se fusionó con el backend tras la
revisión adversarial del TDD: dado el diseño insert-only (ADR 6), mantenerlo separado sumaba
superficie operativa sin un beneficio proporcional al tamaño del equipo. Los ADRs 3, 5, 6, 7 y 8
mencionaban ese servicio como pieza aparte y fueron actualizados en consecuencia.
