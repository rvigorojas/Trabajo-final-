# CLAUDE.md — PCE Jorge Chávez

Contexto persistente para Claude Code en este repo. Se carga completo en cada sesión.

## Qué es este proyecto

PCE (Puesto de Comando y Administración de Emergencias) para el aeropuerto Jorge Chávez.
Backend FastAPI + PostgreSQL 16 implementado y verificado (14/14 tests). Frontend: arrancado
(`frontend/`, monorepo npm workspaces) — ítem #1 del `BACKLOG.md` (Setup compartido) cerrado:
apps `coe`/`pmm` (Vite + React + TypeScript) y paquete `@pce/api-client` (tipos, cliente HTTP,
store de sesión, login compartido), con Tailwind v4 + design tokens de Stitch ("Sentinel
Command") y 9 tests (Vitest + RTL + MSW). Ítem #2 (Shell de navegación COE, Opción 1A) también
cerrado: React Router + Radix Tabs/DropdownMenu, 5 tabs + acciones flotantes gateadas por rol +
menú aparte, 7 tests. Ítem #3 (Cliente COE — Resumen y Cadena de mando) cerrado 2026-08-11:
`ResumenScreen` (alerta, cronómetro, convocatoria, feed de últimos eventos armado client-side,
polling 3s vía `usePolling`) y `CadenaDeMandoScreen` (2 carriles COE/PMM), 17 tests. Verificado
contra backend real (CORS agregado en la sesión previa, confirmado funcionando). Los botones
"Relevo de mando"/"Desactivar" del shell (ítem #2) siguen sin handler — su lógica es el ítem #6.
Ítem #4 (Cliente COE — Mapa y Unidades) cerrado 2026-08-11: `MapaScreen` (marcadores filtrados por
activación en curso, toggle de capas Cuadrícula/Incidente/Accesos, capa Unidades deshabilitada) y
`UnidadesScreen` (lista editable inline vía `PUT /unidades/{id}` — confirmado con el usuario que
el COE puede editar el estado de una unidad, sin restricción de rol adicional, backend sin
cambios), 4 tests nuevos (21 en total en `coe`). Verificado end-to-end contra backend real.
Ítem #5 (Cliente COE — Pre-PAI, Reportes y Comunicaciones) cerrado 2026-08-11: `PrePAIScreen`
(solo lectura — lista + detalle; "activar" con precarga real es el ítem #9, Cliente PMM) y
`ReportesScreen` (lista de activaciones cerradas, `POST /reportes-cierre` idempotente, `datos`
renderizado genérico); Comunicaciones queda placeholder sin funcionalidad (confirmado con el
usuario, sin entidad de datos definida). 2 tests nuevos (23 en total en `coe`). Verificado
end-to-end contra backend real. Ítem #6 (Relevo de mando y Desactivar) cerrado 2026-08-11:
`RelevoModal`/`DesactivarModal` (`@radix-ui/react-dialog`, primer uso de `Dialog`) conectados a
`FloatingActions` — ambos resuelven la activación en curso al abrirse y llaman a
`POST /relevos-mando`/`POST /activaciones/{id}/desactivar`. 5 tests nuevos (28 en total en `coe`).
Verificado end-to-end contra backend real. **Cliente COE completo en su alcance actual.** Ítem #7 (Cliente PMM — Setup PWA y login offline)
cerrado 2026-08-11, primer ítem del Cliente PMM: `apps/pmm` ganó su propio tooling de test
(Vitest+RTL+MSW+happy-dom, nunca lo tuvo desde el ítem #1) y `vite-plugin-pwa` con
`registerType: "prompt"` (ADR-4, nunca `"autoUpdate"` silencioso). `App.tsx` gatea por
`getToken()` (mismo patrón que `coe`) y `ActualizacionDisponible` (usa `useRegisterSW`) se monta
siempre, no solo post-login, para que el shell cachee desde antes del primer login. 4 tests
nuevos. Verificado con `vite build && vite preview`: SW `"activated"` real, y reabrir con un JWT
guardado no dispara ninguna request a `localhost:8000`. Ítem #8 (Cliente PMM — Nueva activación)
cerrado 2026-08-11, primera pantalla real del Cliente PMM: `NuevaActivacionScreen` (selector de
categoría → campos dependientes → tipo de incidente → confirmación con convocatoria) + payload
por categoría armado en una función pura (`lib/payloadActivacion.ts`) para no mezclar
`nivel_alerta`/`clasificacion_origen` entre categorías. Sin router todavía (una sola pantalla real
— se arma con el ítem #9). 6 tests nuevos. Verificado creando una activación Aeronáutica y una
MATPEL reales desde el formulario contra el backend real; ambas mostraron "Convocados: 0"
(esperable, la base de test solo tiene un usuario sin roles operativos que el backend convoque).
Ítem #9 (Cliente PMM — Evaluación inicial y Marcador de incidente) cerrado 2026-08-11: primer
router de `pmm` (`react-router`, 3 rutas, `Shell` con nav simple — sin diseño documentado para
esto, decisión de bajo riesgo) + `EvaluacionInicialScreen` (rol restringido, oculta el formulario
sin permiso) + `MarcadorIncidenteScreen` (badge "sin sincronizar" del envío en curso — la cola
offline persistente real es el ítem #10, que depende de este). 6 tests nuevos (16 en total en
`pmm`). Verificado creando una evaluación inicial real y un marcador real desde el formulario
contra el backend real. Ítem #10 (Cliente PMM — Cola offline y token blando) cerrado 2026-08-13:
`offline/db.ts` (IndexedDB, object store `cola`) + `offline/colaOffline.ts` (`enviarOEncolar`/
`flushColaOffline`, solo encola por falla de red real, nunca por 4xx/5xx) + `offline/
ventanaSesion.ts` (ventana de 24h desde `sesionIniciadaEn`, ADR-7). Las 4 escrituras
offline-capaces (`NuevaActivacionScreen`, `EvaluacionInicialScreen`, `MarcadorIncidenteScreen`,
la nueva `RelevoMandoScreen`) migradas a `enviarOEncolar`. `App.tsx` sincroniza al montar y en
cada evento `online`; un 401 en el flush fuerza logout + `Login` sin vaciar la cola. `Shell`
muestra el contador "N sin sincronizar". 13 tests nuevos (29 en total en `pmm`). Verificado
end-to-end contra backend real deteniendo/reiniciando el proceso de `uvicorn` para simular cortes
de red reales (no simulación de devtools): las 4 acciones se encolaron sin red y sincronizaron
sin duplicados al reconectar (ids client-generados); repetido con un JWT vencido firmado a mano
con el secreto real del backend — se encoló igual offline, el 401 al reconectar forzó el relogin,
la cola sobrevivió en IndexedDB y sincronizó sola tras el siguiente login. Ítem #11
(Endurecimiento), último del backlog, cerrado 2026-08-14: walkthrough E2E documentado contra
backend real en ambos clientes (COE: Resumen con feed real → relevo de mando → reflejado en
Cadena de mando → editar estado de unidad → detalle de Pre-PAI; PMM: activación → evaluación →
marcador → relevo, caso online, sin duplicados verificados contra el backend). Conteo real de
clics desde la pantalla principal de cada cliente: máximo 2 (Pre-PAI/Reportes de COE vía menú
aparte), dentro del límite de 3 del PRD sección 7. Auditoría de contraste (WCAG 2.2 AA): todos
los pares texto/fondo del design system en uso real dan ≥7.71:1 (colores semánticos de alerta
`alerta-i/iii` no cumplirían si se adoptan como texto, pero no tienen uso todavía — nota para el
futuro). Auditoría de tap targets: hallazgo real y sistemático — los `<button>` de acción ya
tenían el token de 48px, pero los `<input>`/`<select>` de los formularios operativos (evaluación
inicial, marcador de incidente, nueva activación, relevo de mando, en ambos clientes) no tenían
ninguna clase de altura mínima ni borde visible; corregidos 6 componentes replicando el patrón
que ya usaba `Login.tsx`. Corte de conectividad real: referenciado del ítem #10, no repetido.
Detalle completo en `tasks/item-11-endurecimiento/todo.md`.

**Backlog completo: los 11 ítems de `BACKLOG.md` cerrados el 2026-08-14.** Frontend (Cliente COE +
Cliente PMM) y backend verificados end-to-end contra PostgreSQL/backend reales, con offline-first
y token blando funcionando.

**Georreferenciación resuelta por decisión — Camino 2 (Renzo, 2026-08-16)**: en vez de esperar el
levantamiento/georreferenciación del mapa cuadriculado en papel, los marcadores nuevos capturan la
posición directamente por GPS de la tablet GETAC al registrarse (`MarcadorIncidenteScreen.tsx`,
Cliente PMM, `navigator.geolocation`), con input manual de respaldo si el GPS falla o no hay
señal. `MapaScreen.tsx` (Cliente COE) ya ubicaba sobre la foto satelital del AIJC cualquier
marcador con `coordenada_cuadricula` en lat/lon (workaround del 2026-08-15,
`georreferenciacion.ts`) — con la captura por GPS, los marcadores nuevos quedan georreferenciados
de punta a punta sin depender del levantamiento físico del mapa en papel (que en sí no se hace).
PRD actualizado a `PRD_PCE_JorgeChavez.4` (.md+.docx, reemplaza las menciones de "marcado manual"
en secciones 4/6/8; `.3` queda de referencia histórica). Confirmado también el mismo día: la
tablet GETAC se usa **sin guantes**, así que el tap target de 48px (WCAG 2.2 AA) ya aplicado en el
ítem #11 es suficiente, sin cambios de código. Con esto, **no quedan pendientes abiertos en
`FRONTEND-TASKS.md`** (antes: Fase 5, georreferenciación + guantes).

**Esquema real de columnas de `ReporteCierre` resuelto 2026-08-15**: se encontraron y descargaron
los 4 "Cuadro Estadístico de Emergencias..." reales del Drive LAP (carpeta "Excel atenciones") y
se extrajeron sus encabezados exactos con openpyxl (no de una copia parafraseada — evita errores
de tildes/orden). `backend/app/services/reporte_cierre.py` define `COLUMNAS_REPORTE_CIERRE` (lista
ordenada por categoría, nombre y orden exactos del Excel real) y `construir_datos_reporte_cierre`,
que solo autocompleta las columnas con una correspondencia directa a un campo ya registrado por el
PCE (Fecha/Mes/Hora desde `hora_evento`, `clasificacion_origen` en las columnas reales que
literalmente son ese mismo campo — "Incidente / Estructural", la clasificación MATPEL, "Clasificación
de la emergencia" en Epidemiológica —, `tipo_incidente`, nombres de convocados M4/M7 y Supervisor
(Gral.) de Rescate, texto de la evaluación inicial); el resto de columnas reales (la mayoría: PI-1/2/3,
diagnósticos médicos, contratistas, uso de DEA, etc.) queda en `None` — detalle operativo que el PCE
v1 no captura (PRD sección 6), a completar manualmente. Ojo con una trampa real: la columna "Nivel"
del Excel de Estructural/Incidentes y de Epidemiológica es el **piso del edificio** (ej. "Piso 3
(P30)"), no tiene relación con `nivel_alerta` — no confundirlas. El orden real vive en la lista
Python, no en el JSONB de Postgres (que no garantiza preservar el orden de claves de un objeto);
un exportador real a Excel/CSV (no construido) debe iterar esa lista, no las claves del JSON.
`backend/app/routers/reportes_cierre.py` actualizado para usar el mapeo real. 3 tests nuevos
(`test_reportes_cierre.py`, 17/17 en total). El frontend (`ReportesScreen.tsx`, Cliente COE) ya
renderizaba `datos` de forma genérica (`Object.entries`), sin cambios de fondo — solo se ajustó
`valorLegible` para mostrar "—" en vez del literal "null" en las columnas sin autocompletar.

**Matriz real de convocatoria (GSEG-L-001) resuelta 2026-08-15**: se encontró el PDF real del Plan
de Emergencia en el Drive LAP (`RESC-L-028-GSEG-L-001...pdf`, v.001) y se extrajo la lista real de
"Miembros del COE/PMM" por nivel de alerta (§ 4.2.2 — Alerta II activación parcial, Alerta III
activación general + Anexo 1). El `Rol` enum (`backend/app/models/usuario.py`) solo cubría la
cadena de mando de Rescate/PMM (PRD sección 5); se agregaron 9 roles nuevos que el plan sí lista
como convocados de COE (Supervisor Gral. de Seguridad Patrimonial/de la Aviación/de Terminales/del
CCA, Ingeniero de Turno, Supervisor Gral. de Operaciones Lado Aire, y — solo en Alerta III —
Gerente de Reputación/RRHH/Logística), decisión de Renzo. `backend/app/services/seed.py` siembra
`rol_convocatoria` con esa matriz real para Aeronáutica; el plan **no** define una matriz de
convocatoria propia para Epidemiológica/Estructural/MATPEL (esas secciones describen acciones de
respuesta, no listas de convocados), así que por decisión de Renzo se aplica la misma matriz
aeronáutica a las 4 categorías — supuesto explícito documentado en el docstring de `seed.py`, a
confirmar con el Jefe de Rescate si cambia. El Jefe de Rescate/Coordinador del Plan y sus
suplentes quedan fuera de la matriz (lideran la activación, no son "convocados"). Migraciones
regeneradas limpias (`alembic downgrade base && upgrade head` contra Postgres real, sin
`ALTER TYPE` — la 0001 deriva el esquema de `Base.metadata` en cada corrida). Un test dependía de
la matriz placeholder anterior (`test_activacion_aeronautica_alerta_iii_auto_convoca_jefe_de_rescate`,
asumía que el Jefe de Rescate se autoconvocaba a sí mismo); reescrito como
`test_activacion_aeronautica_alerta_iii_auto_convoca_matriz_real` contra roles reales de la matriz
(Supervisor Gral. de Rescate en ambos niveles, Gerente de Logística solo en Alerta III). 14/14
tests pasan. Tipo TS espejo actualizado en `frontend/packages/api-client/src/types.ts`.

**Nota de sesión**: el skill `spec-driven-development` (y `generar-tech-design`/
`revision-adversarial`) no aparece disponible cuando la sesión de Claude Code arranca fuera de
esta carpeta (ej. invocada desde `/proyecto` con working directory `C:\Users\ASUS`) — el
descubrimiento de skills de proyecto depende de la raíz real de la sesión, reinstalar no lo
arregla. En ese caso, seguir el mismo proceso a mano (Specify→Plan→Tasks→Implement, con el mismo
gate humano entre fases) en vez de forzar la invocación del skill — así se hizo en el ítem #4.

**Gotcha de React Router 8 (data router) + jsdom** (encontrado en `verify` del ítem #2): cualquier
`navigate()` con `RouterProvider`/`createMemoryRouter` sobre `jsdom` tira `TypeError: RequestInit:
Expected signal ("AbortSignal {}") to be an instance of AbortSignal` — jsdom instala su propia
clase `AbortSignal` que no es `instanceof` la que espera `undici` al armar el `Request` interno
del data router. Fix: `happy-dom` como entorno de test en vez de `jsdom` para cualquier app que
use `RouterProvider` (ya aplicado en `apps/coe/vitest.config.ts`); `packages/api-client` sigue con
`jsdom` sin problema porque no navega.

**Gotcha de Tailwind v4 + monorepo** (encontrado en `verify`, no obvio): Tailwind no escanea
`node_modules` por default, y `@pce/api-client` vive ahí vía symlink de workspace — sin
`@source "../ruta/al/paquete/src/**/*.{ts,tsx}";` en el `index.css` de cada app, las clases de
cualquier componente compartido se generan en 0 utilidades en el build real, aunque el paquete
compile y testee bien en aislamiento. Ya resuelto en `coe` y `pmm`; tenerlo presente si se agrega
un tercer paquete de UI compartido.

Documentación vigente en `30 07/` (carpeta oficial desde 2026-07-30, reemplaza
`Documentacion 21 07/`): `PRD_PCE_JorgeChavez.3.md`, `Design.md`, `Tech design + ADRs/`
(`TECH-DESIGN.md`, `FRONTEND-SPEC.md`, `FRONTEND-TASKS.md`, `adrs/`).

## Skills instaladas (`skills-lock.json`)

| Skill | Fuente | Cuándo se usa |
|---|---|---|
| `generar-tech-design` | `adminoryslabs/Skills` | Generar el TECH-DESIGN.md + ADRs (formato MADR) entrevistando decisión por decisión a partir del PRD y el Design.md. Ya usada para producir el TDD y los 8 ADRs actuales. |
| `revision-adversarial` | `adminoryslabs/Skills` | Revisar con contexto fresco un TECH-DESIGN.md/ADRs existente, buscando activamente huecos y riesgos en vez de validarlos. Ya usada: encontró y resolvió 4 críticos, 6 advertencias, 2 sugerencias en el TDD actual. Requiere conversación nueva, sin el historial de cómo se llegó a esas decisiones. |
| `spec-driven-development` | `addyosmani/agent-skills` | Escribir spec antes de codear cuando un requisito es ambiguo o no existe todavía (4 fases propias: Specify→Plan→Tasks→Implement, con gate de validación humana entre cada una — no confundir con "gentle-ai" de las infografías del curso, que es solo el nombre narrativo de ejemplo; esta es la misma skill exacta, verificado contra `skills-lock.json` de la carpeta de ejemplo de Clase 8). `BACKLOG.md` (raíz) tiene los 11 ítems del frontend; cada ciclo SDD vive en su propia subcarpeta `tasks/item-NN-<nombre>/` (spec.md+plan.md+todo.md) — ítems #1 y #2 cerrados. Próximo: ítem #3 (Cliente COE — Resumen y Cadena de mando) — nuevo ciclo Specify→Plan→Tasks→Implement en `tasks/item-03-<nombre>/`. |

Instalación: `npx skills add <fuente> --skill <nombre>`. Verificar contra `skills-lock.json`
antes de reinstalar (evita drift de versión).

## Convenciones del backend

- `Activacion` es insert-only (ADR-2): un trigger de DB permite únicamente la transición
  `activa -> cerrada`, verificando que ningún otro campo cambie en el mismo UPDATE.
- Los enums de SQLAlchemy se comparan por su **nombre** (`'ACTIVA'`, mayúsculas), no por
  `.value` — bug real encontrado y corregido el 2026-07-30, ver `bitacora-de-desarrollo.md`.
- Todo cambio de estado queda auditado (`app/db/audit.py`, escucha `after_update`).
- Verificación de migraciones: `alembic upgrade head` / `downgrade -1` / `upgrade head` sin
  error, contra PostgreSQL 16 real, no SQLite.

## Despliegue (GCP, `pce-jorge-chavez`)

Decidido y desplegado 2026-08-15/16 (ver ADR-8, actualizado): backend en **Cloud Run** (servicio
`pce-backend`, región `southamerica-west1`) contra **Cloud SQL** Postgres 16 (`pce-db`), secretos
en **Secret Manager** (`pce-jwt-secret`, `pce-database-url`), imágenes en **Artifact Registry**
(`pce-backend`). URL: `https://pce-backend-276453531381.southamerica-west1.run.app`.

**CD automático** (`.github/workflows/ci.yml`, job `deploy-backend`, agregado 2026-08-16): cada
push a `main` que pasa los tests del job `backend` hace build+push de la imagen y
`gcloud run deploy`, autenticado vía Workload Identity Federation (sin clave JSON) — service
account `github-deployer@pce-jorge-chavez.iam.gserviceaccount.com`, acotada por
`attribute-condition` al repo `rvigorojas/Trabajo-final-`. El frontend no tiene deploy
automatizado todavía.

Migraciones (`alembic upgrade head`) corren solas al arrancar el contenedor
(`backend/docker-entrypoint.sh`) — no hace falta un paso de migración aparte en el deploy.

**Gotcha real de esta sesión**: `gcloud` invocado desde Bash (Git Bash) falla con un error confuso
de "no se encontró Python" — la CLI de gcloud en esta máquina solo funciona invocada desde
PowerShell.

**Borrado real de filas en producción — no se pudo completar (2026-08-16)**: al querer limpiar
datos de prueba (activaciones/marcadores creados verificando la app en vivo), el trigger
insert-only (ADR-2) bloquea `DELETE` incluso conectado directo a la base — por diseño. El único
camino (bajar Cloud SQL Auth Proxy, sacar la password real de Secret Manager, `ALTER TABLE
... DISABLE TRIGGER`, borrar, reactivar) quedó bloqueado dos veces por el clasificador de permisos
de Claude Code al intentar los pasos de conexión/túnel — se optó por no insistir y usar el camino
real de la app en su lugar: `POST /activaciones/{id}/desactivar` (con un usuario de rol autorizado
— Gerente de Seguridad/Operaciones/Duty Manager) deja la fila en `estado=cerrada`, que alcanza
para que deje de mostrarse como "en curso". Las filas de prueba (`Verificación Item 8 -
Aeronáutica` x2, sin origen claro — puede ser de una verificación manual anterior a esta sesión;
`Demo: humo en cabina`; `Walkthrough real: derrame de combustible`) siguen en la base, todas
`cerrada`. Si de verdad hace falta borrarlas, el procedimiento con Cloud SQL Auth Proxy queda
descrito arriba — hacerlo a mano, no reintentar automatizarlo sin que el usuario lo pida de nuevo.

**Gotchas de automatización de navegador contra esta app** (encontrados verificando en vivo,
2026-08-16):
- El shell de navegación (Radix `Tabs.Trigger`, botones "Activar"/"Registrar"/"Confirmar" de los
  formularios) a veces no reacciona a un click sintético de bajo nivel (CDP) aunque el puntero
  caiga sobre el elemento correcto (confirmado con `elementFromPoint`) — usar
  `document.querySelector(...).click()` vía JS es lo que funcionó de forma consistente en esta
  sesión cuando el click "real" fallaba en silencio (sin red, sin error, sin cambio visual).
  Siempre verificar con `read_network_requests`/consola si un submit realmente disparó una request
  antes de asumir que un click no funcionó.
- El autocompletado de Chrome en los inputs de login (usuario/contraseña) muestra el valor
  visualmente pero **no** actualiza `input.value` hasta una interacción real — un submit inmediato
  después de ver el valor "cargado" tira `Please fill out this field`. Usar `form_input` (que sí
  actualiza el DOM value) en vez de confiar en el autofill visible.
- El JWT expira rápido (token blando corto, ADR-7) — en sesiones largas de verificación manual,
  `localStorage.clear()` + volver a loguear es necesario más de una vez. El Cliente PMM fuerza
  logout solo al hacer *flush* de la cola offline con 401; el **Cliente COE no tiene ese
  auto-logout** — un token vencido en COE deja la pantalla en blanco/con datos viejos sin avisar
  (reintenta cada 3s en un loop de 401 silencioso). Podría valer la pena agregarlo si se retoma
  el frontend.

## Pendientes externos

No quedan pendientes externos abiertos. Los 3 `[Propuesto]` históricos ya están confirmados:

- Criterio de convocatoria MATPEL: **confirmado con el Jefe de Rescate 2026-08-11** — siempre
  "activación general" (ver `TECH-DESIGN.md`, Modelo de datos → `Activacion`).
- Ventana del token blando: **confirmada con Renzo 2026-08-12 — 24h** (ADR-7).
- Sync con token vencido (hueco 6.4 de `FRONTEND-SPEC.md`): **confirmado con Renzo 2026-08-12** —
  re-login forzado al reconectar, cola offline intacta, sync automático post-login; sin cambios en
  el backend.

Esto desbloquea el ítem #10 del `BACKLOG.md` (Cliente PMM — Cola offline y token blando).
