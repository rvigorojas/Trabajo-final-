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

## Proveedor elegido y despliegue real (2026-08-15/16)

Google Cloud Platform, proyecto `pce-jorge-chavez` (región `southamerica-west1`, Santiago — la más
cercana a Lima):

- **Cloud Run** (servicio `pce-backend`): backend containerizado, autoscaling, migraciones
  (`alembic upgrade head`) corriendo solas al arrancar el contenedor (`docker-entrypoint.sh`).
- **Cloud SQL** (`pce-db`): Postgres 16, tier `db-f1-micro`, edición Enterprise.
- **Secret Manager**: `pce-jwt-secret` y `pce-database-url`, inyectados como variables de entorno
  del servicio Cloud Run; solo la service account de ejecución del servicio (default compute SA)
  tiene `roles/secretmanager.secretAccessor` — nunca se vieron en texto plano.
- **Artifact Registry** (`pce-backend`, Docker): repositorio de imágenes del backend.
- **CD automático** (`.github/workflows/ci.yml`, job `deploy-backend`, agregado 2026-08-16): build
  + push de la imagen + `gcloud run deploy` en cada push a `main`, autenticado vía **Workload
  Identity Federation** (sin clave JSON de larga duración — decisión explícita por ser un sistema
  que eventualmente maneja emergencias reales). Service account `github-deployer@pce-jorge-chavez
  .iam.gserviceaccount.com`, con `roles/run.admin`, `roles/artifactregistry.writer` y
  `roles/iam.serviceAccountUser` sobre el proyecto, y `roles/iam.workloadIdentityUser` acotado por
  `attribute-condition` al repo `rvigorojas/Trabajo-final-` (ningún otro repo puede asumir esta
  identidad).
- **CD del frontend** (job `deploy-frontend`, agregado 2026-08-18): build de ambas apps + `firebase
  deploy --only hosting` a los 2 sitios de Firebase Hosting (`pce-jorge-chavez` para el Cliente COE,
  `pce-jorge-chavez-pmm` para el Cliente PMM), con la misma autenticación por Workload Identity
  Federation y `needs: frontend` como gate. *(Corregido 2026-08-21: este ADR decía que el frontend
  no tenía despliegue automatizado — quedó desactualizado desde el 18/08.)*

El protocolo completo de despliegue (build, artifact, secrets, gates, verify, recovery) vive en
`DEPLOY-PLAN.md` en la raíz del repo. Este ADR registra la decisión; ese documento, la operación.
