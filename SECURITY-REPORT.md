# Security Pass — PCE Jorge Chávez (Puesto de Comando y Administración de Emergencias)

Fecha: 2026-08-19

Alcance revisado:
- **Producto/PRD** — `21 08/PRD_PCE_JorgeChavez.4.md`, sección 7 (roles y accesos).
- **Arquitectura/Diseño+ADRs** — `21 08/Tech design + ADRs/TECH-DESIGN.md` y los 8 ADRs, en
  particular ADR-2 (insert-only), ADR-7 (autenticación y control de acceso), ADR-8 (despliegue).
- **Specs/Tasks** — `BACKLOG.md` y `tasks/item-NN-*/` (revisados por muestreo, no ítem por ítem).
- **Código** — `backend/app/` completo (routers, deps, core/security.py, core/config.py, schemas)
  y `frontend/` completo (`packages/api-client`, `apps/coe`, `apps/pmm`, `firebase.json`,
  `.github/workflows/ci.yml`).
- **Tests** — `backend/tests/` completo (8 archivos), `conftest.py`.
- **Auditoría de dependencias — corrida el 2026-08-19** (pase aparte, ver sección dedicada más
  abajo): `npm audit` (frontend) y `pip-audit` (backend), ya no pendiente.

## Resumen ejecutivo

El sistema tiene buenos fundamentos: passwords con bcrypt, ORM parametrizado (sin inyección SQL
encontrada), triggers insert-only bien implementados y probados (ADR-2), CORS acotado por regex
(no wildcard), y un flujo de sincronización offline que sigue validando el JWT server-side en cada
request aunque el cliente haya operado sin conexión. Sin embargo, hay un hallazgo **crítico real y
en producción**: el endpoint que crea usuarios (`POST /usuarios`) no exige ninguna autenticación y
permite elegir libremente el rol — cualquiera con acceso a la URL pública del backend
(`https://pce-backend-276453531381.southamerica-west1.run.app`) puede crearse una cuenta con rol
`GERENTE_SEGURIDAD` o `DUTY_MANAGER` y desde ahí desactivar activaciones reales o crear activaciones
falsas. Sumado a la ausencia total de rate limiting en el login, el sistema no tiene ninguna barrera
real contra un atacante no autenticado. El resto de la superficie (autorización por rol en los demás
endpoints, manejo de sesión offline) está razonablemente bien pensado.

## Fortalezas de seguridad

- Passwords hasheados con bcrypt (`passlib`, `app/core/security.py:9,12-17`) — nunca en texto plano
  ni con hash débil.
- ORM (SQLAlchemy Core/`select`) en todas las consultas revisadas — no se encontró concatenación de
  SQL ni `text(f"...")` con datos de usuario; la única excepción (`tests/conftest.py:52`, un
  `TRUNCATE` con nombres de tabla fijos del propio código, no input externo) no es explotable.
- Autorización por rol consistente y explícita en los endpoints sensibles: `ROLES_DESACTIVACION`
  (`app/deps.py:64-69`, aplicado en `activaciones.py:102`) y `ROLES_EDICION_EVALUACION_RELEVO`
  (`app/deps.py:53-60`, aplicado en `evaluaciones_iniciales.py:18` y `relevos_mando.py:18`), con
  test de boundary dedicado (`tests/test_rbac_evaluacion_inicial.py`).
- El backend re-valida el JWT en **cada** request, incluida la sincronización de la cola offline del
  Cliente PMM — un rol revocado no puede sortear el chequeo server-side aunque el cliente ya lo haya
  validado localmente contra un token vencido (ADR-7).
- Triggers insert-only (`trg_bloquear_edicion_*`, ADR-2) probados explícitamente
  (`tests/test_insert_only.py`) y el único procedimiento de limpieza que los desactiva
  (`backend/scripts/limpiar_datos_prueba_cloud_sql.sql`) es manual, con una pausa obligatoria de
  revisión humana antes del `DELETE` y sin credenciales embebidas.
- CORS restringido por regex a orígenes reales (`localhost`/`127.0.0.1` + los 2 dominios de Firebase
  Hosting), no un wildcard (`app/core/config.py:17-19`).
- Secretos fuera del repo: `.env` está en `.gitignore`, solo se versionan plantillas
  (`.env.example`) y variables no sensibles (`VITE_API_BASE_URL` en los `.env.production` del
  frontend). En producción real, el JWT secret vive en Secret Manager (`pce-jwt-secret`), no en
  código.

## Findings

### CRITICAL

**SEC-01 — Creación de usuarios sin autenticación, con rol arbitrario**

- Severity: CRITICAL
- Confidence: HIGH
- Category: Authentication bypass / Broken access control / Privilege escalation
- Affected artifact: Backend — endpoint `POST /usuarios`
- Location: `backend/app/routers/usuarios.py:13-14` (declaración del endpoint, sin
  `Depends(get_current_usuario)` ni `Depends(require_role(...))`); `backend/app/schemas/
  usuario.py:8-14` (`UsuarioCreate.rol: Rol`, el caller elige el rol libremente, sin restricción de
  enum ni validación de contra qué roles puede crear)
- Description: `POST /usuarios` no tiene ninguna dependencia de autenticación — cualquier request
  HTTP anónimo que llegue con un `UsuarioCreate` válido crea la cuenta, incluido cualquier valor del
  enum `Rol` (`GERENTE_SEGURIDAD`, `GERENTE_OPERACIONES_AEROPORTUARIAS`, `DUTY_MANAGER`,
  `JEFE_RESCATE`, etc.). El propio código lo reconoce en un comentario: "sin auth por ahora —
  bootstrap de cuentas en esta fase backend-only... Antes de cualquier despliegue real, restringir a
  un rol admin" (`usuarios.py:15-17`) — pero el proyecto **ya está desplegado en producción real**
  (Cloud Run, backend público en
  `https://pce-backend-276453531381.southamerica-west1.run.app`, `CLAUDE.md` sección Despliegue).
- Evidence:
  ```python
  # backend/app/routers/usuarios.py:13-14
  @router.post("", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
  async def crear_usuario(payload: UsuarioCreate, db: AsyncSession = Depends(get_db)) -> Usuario:
      # NOTA: sin auth por ahora — bootstrap de cuentas en esta fase backend-only.
  ```
  `tests/conftest.py:62-72` (`crear_usuario_y_login`) confirma en la práctica que el endpoint se
  llama sin ningún header de autorización durante toda la suite de tests.
- Attack scenario: un atacante externo hace `POST https://pce-backend-.../usuarios` con
  `{"rol": "gerente_seguridad", ...}`, obtiene 201, hace `POST /auth/login` con esas credenciales y
  recibe un JWT válido con rol `GERENTE_SEGURIDAD`. Con ese token puede: desactivar cualquier
  activación real en curso (`ROLES_DESACTIVACION` incluye ese rol, `deps.py:64-69`), crear
  activaciones falsas, y listar todos los usuarios reales del sistema (`GET /usuarios`, sin
  restricción de rol, `usuarios.py:36-40`).
- Potential impact: control total del sistema de gestión de emergencias de un aeropuerto —
  desactivación indebida de una emergencia real en curso, creación de activaciones falsas que
  distraen recursos de rescate, exposición de la nómina completa de usuarios operativos. Es el
  escenario de mayor impacto posible para este sistema específico.
- Existing mitigation: ninguna en el código. El único "control" es el comentario que reconoce el
  hueco y la ausencia (documentada en el PRD/TDD) de un concepto de rol "admin".
- Recommended remediation: exigir autenticación + un rol autorizado para crear usuarios (o mover la
  creación de cuentas fuera del API HTTP público — ej. un script/CLI administrativo que corra contra
  la base directamente, similar en espíritu al script de limpieza ya existente). Esto requiere
  primero una decisión de producto (ver Gobernanza): el PRD/TDD no define un rol "admin".
- Suggested verification: test que confirme `POST /usuarios` devuelve 401/403 sin token o con un rol
  no autorizado, y un test de regresión que confirme que el flujo de login legítimo sigue
  funcionando con la nueva restricción.
- Required change type: **CODE FIX** (bloquear el endpoint) + **PRODUCT / REQUIREMENT CHANGE**
  (definir quién/qué está autorizado a crear usuarios — no existe ese concepto todavía).

### HIGH

**SEC-02 — Sin rate limiting, lockout ni CAPTCHA en `POST /auth/login`**

- Severity: HIGH
- Confidence: HIGH
- Category: Resource exhaustion / missing rate limiting — credential stuffing / brute force
- Affected artifact: Backend — endpoint `POST /auth/login`; Frontend — pantalla de login (ambos
  clientes)
- Location: `backend/app/routers/auth.py:11-20` (sin ningún middleware/dependencia de límite de
  intentos); búsqueda de `ratelimit|rate_limit|slowapi|captcha|throttle|lockout|failed.?attempt` en
  todo `backend/app` y de `captcha|rate.?limit|throttle` en todo `frontend/apps`: **cero
  resultados** en ambos casos.
- Description: el login es la única superficie no autenticada real del sistema (aparte del hallazgo
  SEC-01) y no tiene ningún control de fuerza bruta — ni límite de intentos por IP/usuario, ni
  bloqueo temporal tras fallos consecutivos, ni CAPTCHA, ni backoff.
- Evidence:
  ```python
  # backend/app/routers/auth.py:11-20
  @router.post("/login", response_model=TokenResponse)
  async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
      usuario = await get_usuario_por_username(db, payload.username)
      if usuario is None or not usuario.activo or not verify_password(...):
          raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")
  ```
  Sin ningún control antes o alrededor de esta lógica.
- Attack scenario: un atacante prueba contraseñas comunes contra usernames conocidos/adivinables
  (los roles son predecibles: `duty_manager`, `jefe.rescate`, etc., visibles además vía SEC-01 con
  `GET /usuarios`) a la velocidad que permita la red, sin ningún freno del servidor.
- Potential impact: compromiso de cuentas legítimas por fuerza bruta, agravado porque los roles
  comprometibles incluyen los que pueden desactivar activaciones reales.
- Existing mitigation: bcrypt hace cada intento de verificación más lento que un hash rápido, pero
  eso no reemplaza un límite de intentos — no es una mitigación real de este hallazgo.
- Recommended remediation: agregar rate limiting a `POST /auth/login` (por IP y/o por username,
  ej. `slowapi` o un contador en la propia tabla `usuario`/Redis) y bloqueo temporal tras N intentos
  fallidos consecutivos. CAPTCHA es opcional si el rate limiting ya es efectivo.
- Suggested verification: test que confirme que tras N intentos fallidos el endpoint empieza a
  devolver 429 (o el código elegido) en vez de seguir evaluando credenciales.
- Required change type: **CODE FIX**

### MEDIUM

**SEC-03 — JWT en `localStorage` sin Content-Security-Policy que lo respalde**

- Severity: MEDIUM
- Confidence: HIGH
- Category: Insecure session/token handling — sensitive data exposure
- Affected artifact: Frontend — `@pce/api-client` (compartido por `coe` y `pmm`), despliegue Firebase
  Hosting
- Location: `frontend/packages/api-client/src/session.ts:15` (`STORAGE_KEY = "pce.session.token"`),
  `:36-37` (`saveToken` → `localStorage.setItem`), `:41` (`getToken` → `localStorage.getItem`),
  `:65-66` (`logout` → `localStorage.removeItem`); `frontend/firebase.json` (sin bloque `headers`,
  ninguna Content-Security-Policy configurada en ninguno de los 2 sitios de Hosting)
- Description: el JWT (con claims de rol/permisos) se guarda en `localStorage`, accesible por
  cualquier JavaScript que corra en la página. Esto es, en parte, una necesidad arquitectónica
  reconocida por ADR-7 (el Cliente PMM necesita decodificar los claims localmente para autorizar
  encolado offline sin backend), no un descuido — pero no hay ninguna capa de defensa adicional: no
  se encontró `dangerouslySetInnerHTML` (buena señal, baja el riesgo de XSS propio), pero tampoco hay
  una Content-Security-Policy que limite el daño si una dependencia de terceros introdujera un XSS.
- Evidence: `session.ts:35-42` (ver arriba); `firebase.json` completo no tiene clave `headers` en
  ninguno de los 2 objetos de `hosting`.
- Attack scenario: si cualquier dependencia npm del árbol de `coe`/`pmm` introdujera un XSS (o una
  futura feature renderizara HTML no confiable), el atacante puede leer `localStorage["pce.session.
  token"]` con una sola línea de JS y exfiltrar el token — sin CSP, no hay ninguna barrera que impida
  que ese script llame a un dominio externo.
- Potential impact: robo de sesión con el rol completo del usuario comprometido, válido hasta la
  expiración del token (o hasta 24h si el dispositivo está offline, ADR-7).
- Existing mitigation: ADR-7 ya documenta y acepta el trade-off de revocación tardía por el token
  "blando" — pero ese ADR nunca evaluó el riesgo de robo de token vía XSS específicamente, solo el
  de revocación diferida.
- Recommended remediation: agregar una Content-Security-Policy razonable en `firebase.json`
  (`headers` por sitio, `Content-Security-Policy` restringiendo `script-src`/`connect-src` al propio
  dominio y al backend de Cloud Run) como defensa en profundidad. No se recomienda mover el token a
  cookie `httpOnly` sin antes resolver cómo el Cliente PMM seguiría decodificando claims offline —
  eso sí sería un cambio de arquitectura (ADR-7), no un fix de código simple.
- Suggested verification: escanear la respuesta HTTP de ambos sitios de Hosting y confirmar la
  presencia del header `Content-Security-Policy`.
- Required change type: **CODE FIX** (agregar CSP) — mover el storage del token fuera de
  `localStorage`, si se decidiera, sería **DESIGN / ADR CHANGE** (revisitar ADR-7).

### LOW

**SEC-04 — Sin política de longitud/complejidad de contraseña**

- Severity: LOW
- Confidence: HIGH
- Category: Missing input validation criteria
- Affected artifact: Backend — schema `UsuarioCreate`
- Location: `backend/app/schemas/usuario.py:11` (`password: str`, sin `min_length` ni ninguna otra
  restricción)
- Description: cualquier string, incluida una cadena vacía o de 1 carácter, es aceptado como
  contraseña al crear un usuario (más allá del hueco de autenticación de SEC-01 — esto persiste aun
  si SEC-01 se corrige).
- Evidence: `schemas/usuario.py:8-14` completo, sin validador.
- Attack scenario: un usuario legítimo (o alguien con acceso temporal al endpoint de creación, una
  vez resuelto SEC-01) crea una cuenta con contraseña trivial, debilitando el único factor de
  autenticación del sistema.
- Potential impact: cuentas fáciles de comprometer por fuerza bruta o adivinanza, compuesto con
  SEC-02 (sin rate limiting).
- Existing mitigation: ninguna.
- Recommended remediation: `password: str = Field(min_length=8)` como mínimo, evaluar reglas
  adicionales si el negocio lo pide.
- Suggested verification: test que confirme que una contraseña corta es rechazada con 422.
- Required change type: **CODE FIX**

**SEC-05 — Secreto JWT con valor por defecto débil si falta configuración**

- Severity: LOW
- Confidence: MEDIUM
- Category: Insecure defaults
- Affected artifact: Backend — configuración
- Location: `backend/app/core/config.py:8` (`jwt_secret: str = "cambiar-en-produccion"`)
- Description: si la variable de entorno/secreto de Secret Manager no se inyecta correctamente en
  el contenedor de Cloud Run (error de despliegue, typo en el nombre del secreto, etc.), el backend
  arranca igual y firma tokens con el secreto por defecto, conocido públicamente (está en el propio
  repo). No hay ningún chequeo que falle el arranque si el secreto sigue siendo el valor por
  defecto en un entorno que no es local.
- Evidence: `config.py:1-19` completo — `Settings` no tiene ningún validador que rechace el valor
  por defecto.
- Attack scenario: un fallo de configuración silencioso en el despliegue deja el backend firmando
  (y aceptando) JWTs con un secreto público — cualquiera podría forjar un token válido con el rol
  que quiera, sin pasar por login.
- Potential impact: si ocurriera, sería equivalente en severidad a SEC-01 (control total del
  sistema) — pero requiere que el despliegue esté mal configurado, no es explotable en el estado
  actual verificado del despliegue real (que sí usa Secret Manager, `CLAUDE.md` sección Despliegue).
- Existing mitigation: en la práctica, el despliegue real ya usa Secret Manager
  (`pce-jwt-secret`) — este finding es sobre la ausencia de un *fail-safe* si eso llegara a fallar,
  no sobre el estado actual conocido de producción.
- Recommended remediation: hacer que `Settings` falle al arrancar (`raise` en un validator) si
  `jwt_secret == "cambiar-en-produccion"` y el entorno no es explícitamente `local`/`test`.
- Suggested verification: test que instancie `Settings` con el valor por defecto y un entorno no-
  local, y confirme que lanza una excepción.
- Required change type: **CODE FIX**

### INFO

**SEC-06 — `GET /usuarios` expone datos de contacto de todo el personal a cualquier rol autenticado**

- Severity: INFO
- Confidence: HIGH
- Category: Sensitive data exposure (broad read access)
- Affected artifact: Backend — endpoint `GET /usuarios`
- Location: `backend/app/routers/usuarios.py:36-40` (solo `Depends(get_current_usuario)`, sin
  `require_role`) — devuelve `UsuarioRead`, que incluye `contacto` (`schemas/usuario.py:25`) para
  **todos** los usuarios del sistema, a cualquier usuario autenticado sin importar su rol.
- Description: cualquier rol operativo (ej. un M4/M7 de campo) puede listar el nombre, username,
  rol e información de contacto de toda la nómina, incluida la de Gerencia. No es un bug de
  autenticación (sí requiere estar logueado), pero es una superficie de exposición de PII más amplia
  de lo que probablemente se necesita.
- Evidence: `usuarios.py:36-40`.
- Attack scenario: no es un ataque técnico — es sobre-exposición de datos entre roles legítimos
  del propio sistema.
- Potential impact: bajo, pero es un dato de contacto de personal operativo de una infraestructura
  crítica (aeropuerto) — vale la pena que sea una decisión explícita, no un descuido.
- Existing mitigation: ninguna restricción de rol en este endpoint específico.
- Recommended remediation: evaluar si `GET /usuarios` debería restringirse a roles de gestión, o si
  el campo `contacto` debería omitirse para roles no autorizados.
- Suggested verification: n/a hasta que se tome la decisión de producto.
- Required change type: **PRODUCT / REQUIREMENT CHANGE**

## Prioridad

1. **SEC-01** (CRITICAL) — bloquear `POST /usuarios` sin autenticación es la prioridad absoluta;
   está explotable ahora mismo contra el backend público real.
2. **SEC-02** (HIGH) — rate limiting en login, independiente de SEC-01 pero más urgente todavía una
   vez que SEC-01 esté resuelto (ya no bastaría con crear un usuario propio; fuerza bruta contra
   cuentas existentes pasa a ser el vector principal).
3. **SEC-05** (LOW, pero de impacto CRITICAL si se materializa) — el fail-safe del secreto JWT es
   barato de implementar y cierra un modo de falla silenciosa de alto impacto.
4. **SEC-04** (LOW) — trivial de agregar junto con SEC-01/SEC-02.
5. **SEC-03** (MEDIUM) — agregar CSP es independiente y no bloquea nada de lo anterior.
6. **SEC-06** (INFO) — decisión de producto, sin urgencia técnica.

## Estado de remediación (2026-08-19, post-triage con Renzo)

Todos los `CODE FIX` se implementaron y se verificaron con 29/29 tests pasando
(19 previos + 10 nuevos en `tests/test_usuarios_seguridad.py`) contra PostgreSQL real.
**Nada de esto está commiteado ni pusheado todavía.**

- **SEC-01** — resuelto en código: `Rol.ADMIN` nuevo + `POST /usuarios` exige ese rol,
  salvo tabla vacía (bootstrap: primer usuario debe ser `admin`). Decisión de producto
  tomada: sin IdP externo, alta de cuentas queda dentro del backend actual.
  ⚠️ **Ver "Pendiente operativo antes de producción" abajo — la tabla real de Cloud SQL
  ya NO está vacía, este fix por sí solo bloquearía la creación de cuentas nuevas ahí.**
- **SEC-02** — resuelto: contador en memoria por IP+username, 5 intentos → bloqueo de
  60s (`app/routers/auth.py`). Limitación aceptada: no coordina entre instancias si
  Cloud Run escala a más de una.
- **SEC-03** — resuelto y **verificado contra los 2 sitios reales de Firebase Hosting
  el 2026-08-19**: el header `Content-Security-Policy` llega tal cual se configuró
  (`Invoke-WebRequest` contra `pce-jorge-chavez.web.app` y
  `pce-jorge-chavez-pmm.web.app`). Se abrieron ambos sitios en un navegador real, se
  hizo login completo contra el backend real en el Cliente COE (Resumen → Cadena de
  mando) y no apareció ningún error de consola ni violación de CSP —
  `style-src 'unsafe-inline'` alcanza para lo que genera Tailwind/Vite, y
  `connect-src` no bloquea las llamadas reales al backend de Cloud Run.
- **SEC-04** — resuelto: `password: str = Field(min_length=8)`.
- **SEC-05** — resuelto: `Settings` falla al arrancar si `jwt_secret` sigue en su valor
  por defecto y `entorno` no es `local`/`test`. `ci.yml` actualizado: `ENTORNO=test` en
  el job de tests, `--set-env-vars=ENTORNO=production` en el deploy a Cloud Run.
- **SEC-06** — resuelto: `GET /usuarios` restringido a `ROLES_GESTION_USUARIOS`
  (`Rol.ADMIN` + `ROLES_DESACTIVACION`).

### Pendiente operativo antes de producción (no es código) — resuelto 2026-08-19

El backend real en Cloud Run **ya tenía usuarios creados** (de sesiones de verificación
anteriores) — el mecanismo de bootstrap ("tabla vacía = primer admin sin auth") no se
disparaba ahí, porque la tabla ya no estaba vacía. Además, el enum `rol` de Cloud SQL
real no tenía el valor `ADMIN` (las migraciones 0001-0003 ya estaban aplicadas antes de
que ese rol existiera en el modelo) — se agregó la migración `0004_add_admin_rol.py`
(`ALTER TYPE rol ADD VALUE IF NOT EXISTS 'ADMIN'`), commiteada y desplegada. Con el enum
corregido, se insertó directamente en Cloud SQL real (vía Cloud SQL Auth Proxy + Python/
asyncpg, con el hash bcrypt generado localmente, nunca en texto plano) el primer usuario
`admin` (`username=admin`, `rol=ADMIN`). Verificado end-to-end contra el backend y el
frontend reales: login exitoso (`POST /auth/login`), `GET /usuarios` autorizado, y la app
completa (Cliente COE) funcionando en el navegador con esa sesión.

## Auditoría de dependencias (2026-08-19)

Pase aparte, pendiente en la versión original de este reporte, corrido después de resolver
el admin real:

- **`npm audit`** (`frontend/`, `394` deps de prod + `206` dev + `120` optional): **0
  vulnerabilidades** en las 4 severidades (critical/high/moderate/low/info).
- **`pip-audit`** (`backend/`, venv completo): **6 CVEs encontrados, las 6 en `pip`
  25.2 mismo** (el instalador de paquetes, ej. `PYSEC-2026-196`) — **ninguna** en una
  dependencia real de la app (FastAPI, SQLAlchemy, asyncpg, passlib, bcrypt, PyJWT, etc.).
  Impacto real: bajo. `pip` queda en la imagen Docker final porque `backend/Dockerfile` es
  single-stage (`FROM python:3.12-slim`, sin build separado) — pero no se invoca nunca en
  runtime al servir requests, no es parte de la superficie de ataque expuesta a un
  atacante externo. Mejora de defensa en profundidad, no urgente: pasar a un build
  multi-stage para no dejar herramientas de build en la imagen final.

## Gobernanza / Decisión requerida

- **SEC-01** necesita una decisión de producto además del fix de código: el PRD/TDD no define un
  concepto de rol "admin" ni un proceso de alta de usuarios. Hay que decidir cómo se crean cuentas
  legítimas en producción (¿script administrativo directo contra la base, como ya existe para
  limpieza? ¿un rol admin nuevo? ¿integración con un IdP, la alternativa que ADR-7 ya había
  descartado por ahora?) antes de simplemente "agregar un `require_role`" — no hay ningún rol hoy
  que debiera tener permiso de crear cualquier otro rol sin más contexto.
- **SEC-06** necesita una decisión de producto: ¿es aceptable que cualquier rol vea el contacto de
  toda la nómina, o debería restringirse? No es una vulnerabilidad técnica, es un alcance de
  exposición de datos que nadie decidió explícitamente todavía.
- **SEC-03** (mover el JWT fuera de `localStorage`, si se quisiera ir más allá de la mitigación con
  CSP) requeriría revisitar ADR-7, porque el diseño offline-first actual depende de que el cliente
  pueda leer los claims del token sin llamar al backend.


---

## Hallazgo posterior — 2026-08-21

### CRITICAL

**SEC-07 — Contraseña del usuario `admin` de producción en texto plano en un repositorio público**

- Severity: **CRITICAL**
- Confidence: **HIGH — explotación confirmada en vivo, no teórica**
- Category: Hardcoded credential / secret exposure / broken access control
- Affected artifact: `backend/scripts/crear_admin_cloud_sql.sql`, comentario del paso 2
- Location: el comentario que documenta el origen del hash bcrypt incluye la contraseña literal
  del usuario `admin` (rol `ADMIN`) de la base de producción. El archivo está versionado y el
  repositorio `github.com/rvigorojas/Trabajo-final-` es **público** (verificado el 2026-08-21:
  `repository_public: true`).
- Description: el fix de SEC-01 restringió `POST /usuarios` a rol `ADMIN`, y el admin real se
  insertó a mano en Cloud SQL con este script. El script nunca contuvo la password en el `INSERT`
  (usa el hash, correcto), pero el comentario que explica de dónde salió el hash sí la escribe en
  claro. El resultado neto anula el fix de SEC-01: la barrera existe, y la llave está publicada al
  lado.
- Evidence: el 2026-08-21, desde fuera de la red del proyecto y sin ninguna credencial previa, se
  hizo `POST /auth/login` contra el backend público con el usuario `admin` y la contraseña tomada
  de ese comentario. Resultado: `200` con un JWT válido de rol `ADMIN`, con el que se listaron
  `GET /unidades` (9 filas) y `GET /activaciones` (5 filas) de producción real.
- Attack scenario: cualquier persona que encuentre el repositorio público lee el archivo, se loguea
  como `admin` y obtiene control total: crear usuarios con cualquier rol (`POST /usuarios` ahora
  acepta a un `ADMIN`), desactivar una emergencia real en curso, crear activaciones falsas, listar
  la nómina completa de usuarios operativos.
- Potential impact: idéntico al de SEC-01 — el escenario de mayor impacto posible para este sistema
  — con el agravante de que el vector es más simple (no hace falta ni construir un request: son
  usuario y contraseña).
- Existing mitigation: ninguna. El rate limiting de SEC-02 no aplica: las credenciales son
  correctas, no hay intentos fallidos que contar.
- Recommended remediation, en este orden:
  1. **Rotar la contraseña del usuario `admin` en Cloud SQL** — es la única acción que corta el
     acceso. Borrar la línea del archivo no alcanza: el valor queda en el historial de git y el
     repo ya estuvo público.
  2. Reemplazar el comentario por una referencia al procedimiento (ej. "hash generado localmente
     con `app.core.security.hash_password`; la contraseña se transmite fuera de banda"), sin el
     valor.
  3. Evaluar si el repositorio debe seguir siendo público. Es un sistema de gestión de emergencias
     aeroportuarias con URL de producción publicada en la documentación.
  4. Considerar forzar un cambio de contraseña en el primer login del admin.
- Suggested verification: reintentar el login con la contraseña vieja y confirmar `401`.
- Required change type: **OPERATIONAL FIX** (rotar la credencial en producción — prioridad
  inmediata) + **CODE FIX** (limpiar el comentario) + **PRODUCT / POLICY DECISION** (visibilidad
  del repositorio, política de contraseñas de cuentas administrativas).

**Estado: PARCIALMENTE REMEDIADO — la parte que corta el acceso sigue ABIERTA.**

Encontrado el 2026-08-21 al verificar el despliegue para `DEPLOY-PLAN.md`.

| Acción | Estado |
|---|---|
| Limpiar el comentario del script (CODE FIX) | ✅ Hecho 2026-08-21 |
| `scripts/generar_hash_password.py` — genera el hash sin que la contraseña toque un archivo | ✅ Agregado |
| `scripts/rotar_password_admin_cloud_sql.sql` — procedimiento de rotación listo | ✅ Agregado |
| Regla dura en `CLAUDE.md` para que no se repita | ✅ Agregada |
| **Rotar la contraseña en Cloud SQL (OPERATIONAL FIX)** | ❌ **Pendiente — es lo único que corta el acceso** |
| Decidir la visibilidad del repositorio | ❌ Pendiente (decisión de producto) |

Mientras la rotación no se ejecute, la contraseña original sigue siendo válida contra el backend
de producción y sigue siendo recuperable del historial de git de un repositorio público. El code
fix **no** reduce el riesgo por sí solo.

### Lección para el harness / las reglas

Este hallazgo no lo habría encontrado un `security-pass` que solo mire el código de la aplicación:
el archivo es un script operativo auxiliar, y el problema no es el `INSERT` sino un comentario.
Regla derivada, a agregar a `CLAUDE.md`: **ningún archivo versionado puede contener una contraseña,
token o clave en claro — tampoco dentro de un comentario, un docstring, un ejemplo de uso o un
mensaje de commit.** Si un procedimiento necesita una credencial, se referencia dónde vive
(Secret Manager), nunca su valor.
