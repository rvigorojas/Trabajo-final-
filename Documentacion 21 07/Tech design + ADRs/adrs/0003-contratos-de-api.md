# ADR 3: Contratos de API

## Estado

Aceptado

## Contexto

Con el sistema dividido en tres componentes (cliente PMM offline-first, cliente COE online, y
backend — que incluye el módulo de sincronización, ADR 1), hay que definir la forma del contrato
entre los clientes y el backend. El requisito crítico es que el cliente PMM debe poder encolar peticiones cuando pierde
señal en pista y reenviarlas automáticamente al reconectar (PRD, sección 7), sin bloquear el flujo
operativo del Comandante de Incidente.

## Decisión

REST sobre HTTP/JSON, con endpoints organizados por recurso (`/activaciones`, `/unidades`,
`/relevos`, `/marcadores-incidente`, `/pre-pai`, etc.), propiedad del contrato en el backend
principal.

## Alternativas consideradas

- **GraphQL** — permitiría a cada cliente (COE y PMM muestran vistas muy distintas según el
  wireframe) pedir exactamente los campos que necesita, reduciendo over-fetching en tablets con
  conectividad limitada. No se eligió porque suma complejidad de servidor (resolvers, schema) y
  porque las mutaciones offline encoladas por un service worker son menos naturales de modelar que
  con verbos HTTP estándar (POST/PUT idempotentes por recurso).
- **RPC binario (gRPC)** — eficiente en payload. No se eligió porque el soporte en navegadores/PWA
  es pobre (requeriría gRPC-web más un proxy adicional), un mal ajuste para tablets GETAC con
  conectividad inestable en pista, y con el módulo de sincronización viviendo dentro del mismo
  backend (ADR 1) no hay un segundo servicio interno que se beneficie de un protocolo binario aparte.

## Consecuencias

- Los verbos HTTP estándar (POST para crear, PUT/PATCH para actualizar) mapean naturalmente a la
  cola de peticiones que el service worker del cliente PMM debe reintentar al reconectar, y el
  contrato es fácil de depurar en campo con herramientas estándar.
- Cada endpoint expone potencialmente más campos de los que cada vista del wireframe necesita
  (over-fetching), lo que puede pesar en el ancho de banda limitado de la tablet GETAC si no se
  diseñan las respuestas con cuidado por endpoint.
