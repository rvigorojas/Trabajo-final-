# DEPLOY-PLAN.md — PCE Jorge Chávez

Protocolo de despliegue del PCE (Puesto de Comando y Administración de Emergencias) del AIJC.

- **Fecha del plan:** 2026-08-21
- **Estado:** DISCOVER y DESIGN completos. Sistema **ya desplegado y operativo** — este documento
  formaliza el protocolo que se venía ejecutando desde el 2026-08-15/16, no propone uno nuevo.
- **Aprobado por:** Renzo Vigo (checkpoint DESIGN → GENERATE)
- **Referencias:** ADR-8 (estrategia de despliegue), `.github/workflows/ci.yml`, `SECURITY-REPORT.md`

> Regla de este plan: nada de infraestructura, secretos ni acciones destructivas se ejecuta sin
> autorización explícita, acción por acción. Las secciones marcadas **[PENDIENTE]** son huecos
> reales, no se dan por resueltos.

---

## 1. DISCOVER — qué es este sistema y qué necesita para desplegarse

### Componentes desplegables

| Componente | Tecnología | Destino | Estado |
|---|---|---|---|
| Backend + módulo de sync | FastAPI (Python 3.12), contenedor Docker | Cloud Run `pce-backend` | Desplegado |
| Base de datos | PostgreSQL 16 | Cloud SQL `pce-db` (`db-f1-micro`, Enterprise) | Desplegado |
| Cliente COE | React + Vite (SPA, siempre online) | Firebase Hosting, target `coe` | Desplegado |
| Cliente PMM | React + Vite + `vite-plugin-pwa` (offline-first) | Firebase Hosting, target `pmm` | Desplegado |

### URLs reales (verificadas el 2026-08-21)

| Recurso | URL | Verificación |
|---|---|---|
| Backend | `https://pce-backend-276453531381.southamerica-west1.run.app` | `GET /salud` → `200 {"estado":"ok"}` |
| Cliente COE | `https://pce-jorge-chavez.web.app` | `200`, sirve `index.html` |
| Cliente PMM | `https://pce-jorge-chavez-pmm.web.app` | `200`, sirve `index.html` |
| Endpoints protegidos | `GET /unidades`, `GET /activaciones` | `401` sin token — la autorización está activa en producción |

### Proyecto cloud

Google Cloud Platform, proyecto `pce-jorge-chavez`, región `southamerica-west1` (Santiago — la más
cercana a Lima, elegida por latencia hacia el AIJC).

### Restricciones que condicionan el deploy

1. **El Cliente PMM es offline-first.** Un deploy que rompa el service worker deja a la tablet
   GETAC sin capacidad de operar en pista. `registerType: "prompt"` (ADR-4) — nunca `autoUpdate`
   silencioso: el operador decide cuándo recargar, no el deploy.
2. **Las tablas son insert-only (ADR-2).** Un rollback de código **no** revierte datos. Los
   triggers `trg_bloquear_edicion_*` bloquean `UPDATE`/`DELETE` incluso conectado directo a la base.
3. **Objetivo de uptime del PRD: ≥99.9% en horario operativo.** Determina el uso de una plataforma
   managed con autoscaling en vez de un servidor único (ADR-8).
4. **Equipo de 1-3 personas.** El protocolo no puede exigir operación manual de infraestructura.

---

## 2. BUILD

### Backend

`backend/Dockerfile` — single-stage sobre `python:3.12-slim`:

```
COPY pyproject.toml, app/, alembic/, alembic.ini, docker-entrypoint.sh
RUN pip install --no-cache-dir .
ENTRYPOINT ["./docker-entrypoint.sh"]   # alembic upgrade head && exec "$@"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Decisión deliberada:** las migraciones corren en el `ENTRYPOINT`, no como paso separado del
pipeline. Origen real: probando `docker-compose` el 2026-08-16, el contenedor arrancaba contra una
base sin tablas y el `lifespan` de `app/main.py` (`seed_rol_convocatoria`) crasheaba. Consecuencia:
cada arranque de instancia de Cloud Run intenta `alembic upgrade head` — es idempotente, pero
significa que **una migración rota bloquea el arranque del servicio**, no solo un paso de CI.

**Deuda conocida:** el build es single-stage, así que `pip` queda en la imagen final. `pip-audit`
(2026-08-19) reportó 6 CVEs, las 6 en `pip` 25.2 mismo, ninguna en dependencia de la app. `pip` no
se invoca en runtime → impacto real bajo. Mejora de defensa en profundidad, no urgente: pasar a
build multi-stage.

### Frontend

Monorepo npm workspaces (`frontend/`): `npm ci` → `npm run build --workspaces --if-present`.
Produce `apps/coe/dist` y `apps/pmm/dist`.

**Trampa documentada (Tailwind v4 + monorepo):** Tailwind no escanea `node_modules`, y
`@pce/api-client` vive ahí vía symlink de workspace. Sin la directiva `@source` en el `index.css`
de cada app, las clases de los componentes compartidos se generan en **0 utilidades en el build de
producción** aunque los tests pasen. Ya resuelto en `coe` y `pmm`; verificar si se agrega un tercer
paquete de UI compartido.

---

## 3. ARTIFACT

| Artefacto | Almacén | Versionado |
|---|---|---|
| Imagen del backend | Artifact Registry `southamerica-west1-docker.pkg.dev/pce-jorge-chavez/pce-backend/pce-backend` | Tag = `${{ github.sha }}` |
| Bundles del frontend | Firebase Hosting (versiona cada release internamente) | Release automática de Firebase |

El tag por SHA de commit es lo que hace posible el rollback del backend (sección 9): cada imagen es
trazable a un commit exacto, no hay `:latest` mutable.

---

## 4. CONFIG & SECRETS

### Producción (Cloud Run)

| Variable | Origen | Notas |
|---|---|---|
| `DATABASE_URL` | Secret Manager `pce-database-url` | Nunca en texto plano, nunca en el repo |
| `JWT_SECRET` | Secret Manager `pce-jwt-secret` | Idem |
| `ENTORNO` | `--set-env-vars=ENTORNO=production` en el deploy | **Fail-safe de SEC-05** |
| `JWT_ALGORITHM` | Default `HS256` (`app/core/config.py`) | — |

**Fail-safe activo (SEC-05, security-pass 2026-08-19):** `Settings._fail_safe_secreto_por_defecto`
lanza `ValueError` al arrancar si `entorno` no es `local`/`test` **y** `jwt_secret` sigue siendo
`"cambiar-en-produccion"`. Un deploy que pierda la inyección del secreto **no arranca** en vez de
servir tráfico real con un secreto público. Es un guardrail de arranque, no un chequeo opcional.

**Acceso a secretos:** solo la service account de ejecución del servicio Cloud Run (default compute
SA) tiene `roles/secretmanager.secretAccessor`. La SA de despliegue (`github-deployer`) **no** puede
leer los secretos — solo desplegar.

### Frontend

`VITE_API_BASE_URL` en los `.env.production` de cada app. **No es secreto** (es una URL pública),
por eso sí se versiona.

### Local

`.env.example` → copiar a `.env` (gitignoreado). `docker-compose.yml` sobreescribe `DATABASE_URL`
para apuntar al servicio `db`.

---

## 5. INFRAESTRUCTURA

```
GitHub (rvigorojas/Trabajo-final-, rama main)
   │  Workload Identity Federation (sin clave JSON)
   ▼
github-deployer@pce-jorge-chavez.iam.gserviceaccount.com
   │  roles/run.admin · roles/artifactregistry.writer · roles/iam.serviceAccountUser
   ├──► Artifact Registry ──► Cloud Run (pce-backend) ──► Cloud SQL (pce-db, Postgres 16)
   │                                │
   │                                └──► Secret Manager (pce-jwt-secret, pce-database-url)
   └──► Firebase Hosting ──► coe (pce-jorge-chavez.web.app)
                          └► pmm (pce-jorge-chavez-pmm.web.app)
```

**Decisión de seguridad explícita:** Workload Identity Federation en vez de una clave JSON de larga
duración, con `attribute-condition` que acota la identidad al repositorio
`rvigorojas/Trabajo-final-`. Ningún otro repo puede asumir esta identidad. Tomada por tratarse de un
sistema que eventualmente maneja emergencias reales.

**Cabeceras de seguridad (SEC-03):** `Content-Security-Policy` configurada por sitio en
`frontend/firebase.json`, con `connect-src` apuntando explícitamente al backend de Cloud Run y
`frame-ancestors 'none'`. Verificada contra los 2 sitios reales el 2026-08-19.

**CORS:** regex en `app/core/config.py` — `localhost`/`127.0.0.1` con cualquier puerto (dev servers
de Vite) + los 2 dominios de Firebase (`.web.app` y `.firebaseapp.com`). No es wildcard.

---

## 6. RELEASE STRATEGY

**Trigger:** push a `main`. No hay despliegue manual como camino normal.

**Estrategia:** rolling replace gestionado por Cloud Run (revisión nueva recibe 100% del tráfico al
pasar sus health checks; la revisión anterior queda disponible para rollback). Firebase Hosting hace
release atómica por sitio.

**Por qué no blue/green ni canary:** con 1-3 personas operando y un servicio de un solo backend, el
costo operativo de mantener dos entornos supera el beneficio. El rollback por revisión de Cloud Run
cubre el caso real (sección 9). Revisar esta decisión si el sistema pasa a uso operativo 24/7 tras
el corte del 2026-09-01.

### Pipeline real (`.github/workflows/ci.yml`)

| Job | Corre en | Depende de | Qué hace |
|---|---|---|---|
| `backend` | push + PR | — | `pytest` contra Postgres 16 real (service container) |
| `frontend` | push + PR | — | lint + test + build de `coe`, `pmm`, `api-client` |
| `docker-compose` | push + PR | — | Smoke test: levanta el stack limpio y espera `GET /salud` |
| `deploy-backend` | solo push a `main` | `backend` | Build + push de imagen + `gcloud run deploy` |
| `deploy-frontend` | solo push a `main` | `frontend` | `npm run build` + `firebase deploy --only hosting` |

> **Corrección documental pendiente:** ADR-8 dice *"El frontend no tiene despliegue automatizado
> todavía"*. Es falso desde que se agregó el job `deploy-frontend`. Actualizar ADR-8.

---

## 7. DEPLOY GATES

Un cambio llega a producción solo si pasa, en orden:

1. **Gate de tests del backend** — `deploy-backend` declara `needs: backend`. Si `pytest` falla
   (32 tests contra Postgres real), no hay deploy. No es opcional ni salteable.
2. **Gate de tests del frontend** — `deploy-frontend` declara `needs: frontend`. Lint + tests
   (36 en `coe`, 31 en `pmm`, 12 en `api-client`) + build deben pasar.
3. **Gate de rama** — `if: github.ref == 'refs/heads/main'`. Un PR corre todos los tests pero
   nunca despliega.
4. **Gate de arranque (runtime)** — `alembic upgrade head` en el entrypoint + el fail-safe de
   `JWT_SECRET`. Si la migración falla o falta el secreto, la revisión no queda sana y Cloud Run
   no le pasa tráfico.

### Guardrail de agente (no de CI)

`.claude/settings.json`, hook `PreToolUse`: intercepta comandos que contengan `DISABLE TRIGGER`,
`DELETE FROM`, `gcloud sql instances/databases delete` o `gcloud sql instances patch` y exige
confirmación humana explícita. Es una **regla dura**, no una instrucción en `CLAUDE.md` — el
criterio de la sesión 09 aplica: el costo de que falle una vez (borrar datos de emergencias reales)
es alto.

Segundo hook, `SessionStart`: avisa si hay commits locales sin pushear — evita el escenario de
"el fix existe en mi máquina pero producción sigue rota".

---

## 8. VERIFY & OBSERVE

### Verificación post-deploy (checklist ejecutable)

| # | Chequeo | Comando / acción | Resultado esperado |
|---|---|---|---|
| 1 | Backend vivo | `GET /salud` | `200 {"estado":"ok"}` |
| 2 | Autorización activa | `GET /unidades` sin token | `401` |
| 3 | Migraciones al día | Logs de arranque de la revisión de Cloud Run | `alembic upgrade head` sin error |
| 4 | Camino crítico backend | Login con usuario real → `GET /activaciones` | `200` con token válido |
| 5 | Flota sembrada | `GET /unidades` con token | 9 identificadores (R1, R2, R8-R13, CR9) |
| 6 | Una sola activación activa | Intentar crear una 2ª activación con una `ACTIVA` | `409` con mensaje claro |
| 7 | COE sirve | `https://pce-jorge-chavez.web.app` | `200`, login carga |
| 8 | PMM sirve + SW | `https://pce-jorge-chavez-pmm.web.app` | `200`, service worker `activated` |
| 9 | CSP llega | `Invoke-WebRequest` a ambos sitios | Header `Content-Security-Policy` presente |

Resultado de la corrida del **2026-08-21** (evidencia en la sección 13):

- **Chequeos 1, 2, 7, 8: OK.**
- **Chequeo 3: OK** — migración `0005` aplicada en Cloud SQL real, sin error.
- **Chequeo 4: OK** — login real contra el backend de producción → `200` con JWT válido;
  `GET /activaciones` → `200`, 5 activaciones, ninguna en estado `activa`.
- **Chequeo 5: OK** — `GET /unidades` → **9 filas**, todas en estado `ok`: R1, R2, R8, R9, R10,
  R11, R12, R13, CR9. `seed_unidades()` funcionó en Cloud SQL real.
- **Chequeo 6: OK a nivel de esquema.** La constraint está aplicada en producción (log de la
  migración). **No se ejercitó por HTTP a propósito**: hacerlo exige crear activaciones reales en
  la base de producción, y las tablas son insert-only — quedarían para siempre. Se valida en la
  suite de tests contra Postgres real, no contra producción.

> ⚠️ **Este chequeo destapó un hallazgo CRITICAL de seguridad — SEC-07 en `SECURITY-REPORT.md`.**
> La credencial usada para el login salió de un comentario en `backend/scripts/
> crear_admin_cloud_sql.sql`, un archivo versionado en un repositorio **público**. Estado: abierto,
> requiere rotar la contraseña del admin en producción.

### Observabilidad

**Lo que hay:** logs y métricas de Cloud Run (requests, latencia, errores 5xx, instancias activas)
en Cloud Logging / Cloud Monitoring por default. `GET /salud` como health endpoint.

**[PENDIENTE] Lo que no hay:** ninguna alerta configurada. Nadie se entera automáticamente si el
servicio empieza a devolver 5xx o si Cloud SQL se queda sin conexiones. Para un sistema con un
objetivo de 99.9% de uptime, esto es el hueco más real del plan.

Mínimo propuesto (no implementado): una alerta de Cloud Monitoring sobre tasa de 5xx > 5% en 5 min
y otra sobre `pce-db` con conexiones > 80% del límite, ambas a un canal de notificación real.

---

## 9. RECOVERY

### Rollback del backend

Cloud Run conserva las revisiones anteriores. Redirigir el tráfico a la última revisión sana:

```powershell
# gcloud SOLO funciona desde PowerShell en esta máquina — desde Git Bash falla
# con un error confuso de "no se encontró Python" (gotcha real documentado).
gcloud run revisions list --service=pce-backend --region=southamerica-west1 --project=pce-jorge-chavez
gcloud run services update-traffic pce-backend --to-revisions=<REVISION_SANA>=100 `
  --region=southamerica-west1 --project=pce-jorge-chavez
```

Verificar después: chequeos 1, 2 y 4 de la sección 8.

### Rollback del frontend

Firebase Hosting → consola del sitio → *Release history* → **Rollback** sobre la release anterior.
Atómico y por sitio: `coe` y `pmm` se revierten por separado.

### El rollback de código NO es rollback de datos

Punto crítico de este sistema en particular:

- Las tablas son **insert-only** (ADR-2). Un trigger permite únicamente `activa → cerrada` en
  `Activacion`, verificando que ningún otro campo cambie. Revertir el código no borra ni corrige
  filas escritas por la versión defectuosa.
- Una **migración de Alembic ya aplicada no se revierte sola** al revertir la revisión de Cloud Run:
  el entrypoint solo hace `upgrade head`, nunca `downgrade`. Si una migración es incompatible hacia
  atrás, el rollback de imagen deja código viejo contra un esquema nuevo.
- El procedimiento de limpieza de datos existe y es **deliberadamente manual**:
  `backend/scripts/limpiar_datos_prueba_cloud_sql.sql` (Cloud SQL Auth Proxy + `DISABLE TRIGGER` +
  `DELETE` + reactivar), con pausa obligatoria de revisión humana y sin credenciales embebidas.
  El hook `PreToolUse` obliga a confirmación explícita antes de cualquier comando de ese tipo.

**Regla operativa:** ante un incidente, primero rollback de código para detener el daño; la
corrección de datos se evalúa después, a mano, con una persona decidiendo.

### Precaución específica del Cliente PMM

`registerType: "prompt"` (ADR-4): un deploy de frontend **no** actualiza la tablet en pista de
forma silenciosa — el operador ve el aviso `ActualizacionDisponible` y decide. Consecuencia real:
tras un deploy, una tablet puede seguir corriendo la versión anterior por tiempo indefinido. Si un
cambio de backend rompe compatibilidad con el cliente viejo, hay que mantener el backend
retrocompatible, no asumir que todos los PMM ya actualizaron.

---

## 10. CHECKPOINT DE APROBACIÓN (DESIGN → GENERATE)

Este plan **describe el sistema de deployment real y ya operativo**. Los artefactos que un
`GENERATE` produciría (`ci.yml`, `Dockerfile`, `docker-entrypoint.sh`, `firebase.json`) ya existen y
están en producción. No hay nada que generar desde cero.

Lo que sí queda para ejecutar está en la sección 11.

Aprobado: **Renzo Vigo, 2026-08-21.**

---

## 11. PENDIENTES REALES

Ordenados por riesgo. Ninguno se da por resuelto.

| # | Pendiente | Riesgo | Acción |
|---|---|---|---|
| 0 | **SEC-07 (CRITICAL): contraseña del `admin` de producción publicada. Riesgo aceptado hasta el 2026-09-01**, decisión de Renzo — el sistema no está en uso operativo y los datos son de verificación. | **Máximo a partir del 2026-09-01** (fecha de corte de los Excel). Hasta entonces: acotado a datos de prueba | **Rotar antes del corte.** Procedimiento listo en `backend/scripts/rotar_password_admin_cloud_sql.sql`. Reevaluar de inmediato si se registra una emergencia real antes de esa fecha. Ver `SECURITY-REPORT.md` |
| 1 | ~~Verificar que la migración `0005` llegó a Cloud SQL y que `seed_unidades()` sembró la flota~~ → **RESUELTO Y VERIFICADO 2026-08-21** (sección 13): migración aplicada, 9 unidades en producción, login y lectura funcionando. | — | Cerrado |
| 2 | **Sin alertas de monitoreo.** Una caída se detecta cuando alguien la nota. | Alto contra el objetivo de 99.9% del PRD | Crear 2 alertas de Cloud Monitoring (5xx y conexiones de Cloud SQL) |
| 3 | ~~ADR-8 decía que el frontend no tenía deploy automatizado~~ → **CORREGIDO 2026-08-21** en ADR-8 y en `CLAUDE.md`. | — | Cerrado |
| 4 | **Sin entorno de staging.** Todo cambio que pasa los tests va directo a producción. | Medio | Evaluar una segunda revisión de Cloud Run sin tráfico como pre-producción |
| 5 | **Build single-stage** deja `pip` en la imagen final (6 CVEs, ninguna explotable en runtime). | Bajo | Pasar a build multi-stage |
| 6 | **Rate limiting en memoria** (SEC-02): el contador de intentos de login no coordina entre instancias si Cloud Run escala a más de una. | Medio | Mover a un store compartido si el tráfico justifica más de una instancia |

---

## 12. HISTORIAL

| Fecha | Evento |
|---|---|
| 2026-08-15/16 | Despliegue inicial: Cloud Run + Cloud SQL + Secret Manager + Artifact Registry (ADR-8) |
| 2026-08-16 | CD del backend vía Workload Identity Federation; `docker-entrypoint.sh` agregado tras el hallazgo del smoke test de `docker-compose` |
| 2026-08-18 | Deploy del frontend a Firebase Hosting (2 sitios); CORS ampliado a esos dominios |
| 2026-08-19 | Security pass: CSP verificada en ambos sitios, `ENTORNO=production` en el deploy, migración `0004` (rol `ADMIN`) desplegada |
| 2026-08-21 | Este plan. Verificados: `/salud` 200, `401` en endpoints protegidos, ambos sitios sirviendo |

---

## 13. REGISTRO DE VERIFICACIÓN — 2026-08-21

Corrida real contra la infraestructura de producción. Evidencia, no supuesto.

### Producción está al día con `main`

| Dato | Valor |
|---|---|
| Revisión activa de Cloud Run | `pce-backend-00025-9qm` (2026-08-21 23:07 UTC) |
| Imagen que corre | `pce-backend@sha256:6faab321…`, taggeada `f1e5bdfeb5125ebba3bd414f09cbcb2716787aa5` |
| Último commit de `main` | `f1e5bdf` — *"Renombrar la carpeta de documentación de 30 07 a 21 08"* |
| Estado de git | `main` sincronizado con `origin/main`, sin commits sin pushear |

El tag de la imagen coincide exactamente con el SHA del último commit: **el CD funcionó y no hay
drift entre el repo y producción.** 4 revisiones desplegadas el mismo día (`00022` → `00025`),
todas correspondientes a los commits del walkthrough del 19/08.

### La migración `0005` sí llegó a Cloud SQL

Log de la revisión `pce-backend-00022-zdn`, 2026-08-21 21:49:22 UTC:

```
INFO [alembic.runtime.migration] Running upgrade 0004_add_admin_rol -> 0005_una_activacion_activa,
índice único parcial: como máximo una Activacion en estado ACTIVA a la vez.
```

Esto **cierra el pendiente que `CLAUDE.md` declaraba abierto** (*"esta migración todavía no se
aplicó contra Cloud SQL real ni se desplegó"*). El índice único parcial está activo en producción,
así que el hallazgo #1 del walkthrough del 19/08 (dos activaciones simultáneas dejando una
huérfana) ya no puede reproducirse contra el sistema real.

Nota: la migración incluye una guarda que aborta si encuentra más de una fila `ACTIVA` al aplicarse.
Corrió sin excepción → la base de producción no tenía ese problema.

### Sin errores de arranque

Búsqueda de `Traceback` / `Error` / `ValueError` en los logs del servicio `pce-backend` de las
últimas 12 horas: **cero resultados**. Los arranques muestran `Application startup complete` y el
`STARTUP TCP probe` pasando al primer intento.

### Estado funcional de producción (con sesión autenticada)

| Recurso | Resultado |
|---|---|
| `POST /auth/login` | `200`, JWT de rol `ADMIN` |
| `GET /unidades` | `200` — **9 filas**: R1, R2, R8, R9, R10, R11, R12, R13, CR9, todas en estado `ok` |
| `GET /activaciones` | `200` — 5 activaciones históricas, ninguna en estado `activa` |

La flota de unidades **sí quedó sembrada en Cloud SQL**: el hallazgo #3 del walkthrough del 19/08
("Unidades está vacía en producción") está resuelto y verificado contra el sistema real.

### Endpoints

| Chequeo | Resultado |
|---|---|
| `GET /salud` | `200 {"estado":"ok"}` |
| `GET /unidades` sin token | `401` |
| `GET /activaciones` sin token | `401` |
| `https://pce-jorge-chavez.web.app` | `200`, sirve el Cliente COE |
| `https://pce-jorge-chavez-pmm.web.app` | `200`, sirve el Cliente PMM |

### Gotcha nuevo encontrado hoy

`gcloud` tampoco funciona invocado como `gcloud` desde PowerShell en esta máquina: la Execution
Policy de Windows bloquea `gcloud.ps1` (`UnauthorizedAccess`). El camino que sí funciona es invocar
`gcloud.cmd` desde `cmd`, con `cd` previo al directorio del SDK:

```
cd /d "C:\Users\ASUS\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin" && gcloud.cmd ...
```

Esto amplía el gotcha ya documentado en `CLAUDE.md` (*"gcloud desde Git Bash falla con un error
confuso de Python; solo funciona desde PowerShell"*) — hoy tampoco funcionó desde PowerShell.
