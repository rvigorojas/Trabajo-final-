# ADR 8: Estrategia de despliegue y disponibilidad

## Estado

Aceptado

## Contexto

El PRD (sección 4) fija un criterio de éxito medible de ≥99.9% uptime en horario operativo,
confirmado por Renzo. El equipo que construye y va a operar el sistema es chico (1-3 personas, ADR
4), por lo que la estrategia de despliegue debe alcanzar ese objetivo de disponibilidad sin exigir
una carga operativa de infraestructura que ese equipo no puede sostener.

## Decisión

Despliegue managed/serverless con autoscaling (ej. Cloud Run / App Runner) para el backend (que
incluye el módulo de sincronización, ADR 1), donde el proveedor cloud gestiona el reinicio
automático de instancias caídas y el escalado, sin que el equipo administre servidores directamente.

## Alternativas consideradas

- **Servidor único + backups y monitoreo** — más simple y barato de operar. No se eligió porque es
  un punto único de falla: cualquier despliegue o caída del servidor causa downtime real hasta el
  reinicio manual, lo que pone en riesgo directo el objetivo de 99.9% con un equipo chico que no
  puede garantizar respuesta inmediata ante una caída.
- **Redundante (multi-instancia + balanceador) autogestionado** — daría disponibilidad real alta
  tolerando la caída de una instancia. No se eligió porque exige orquestación, healthchecks y
  operación continua de infraestructura que un equipo de 1-3 personas no puede sostener de forma
  confiable a largo plazo — es esencialmente reconstruir a mano lo que un proveedor managed ya
  ofrece.

## Consecuencias

- El equipo chico no necesita operar ni parchear servidores, y el proveedor cloud absorbe gran parte
  del trabajo para sostener el objetivo de 99.9% uptime.
- El proyecto queda atado a las capacidades y límites del proveedor cloud elegido (vendor lock-in
  parcial), y si una fase futura necesita conexiones persistentes de larga duración (ej. WebSocket
  para posición en vivo de unidades, hoy fuera de alcance v1 según PRD sección 6), habrá que validar
  que la plataforma managed elegida las soporte bien antes de comprometerse a esa dirección.
