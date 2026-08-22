# GOTCHAS-REPORT.md — revisión de gotchas de testing

Generado por el harness `gotchas-testing` (`harnesses/gotchas-testing/`) el **2026-08-21**.

Este reporte **no modifica `CLAUDE.md`** — actualizarlo a partir de acá es una decisión humana,
punto por punto. Ver el guardrail del `SKILL.md`.

## Corrida de la suite completa

| Suite | Resultado | Tiempo |
|---|---|---|
| Backend (`pytest`, contra PostgreSQL 16 real) | **32 passed**, 61 warnings | 31.98 s |
| Frontend `coe` (Vitest + RTL + MSW) | **36 passed** (15 archivos) | — |
| Frontend `pmm` | **31 passed** (10 archivos) | — |
| `@pce/api-client` | **12 passed** (3 archivos) | — |
| **Total** | **111 tests, 0 fallos** | — |

---

## Vigentes

**G-01 — React Router 8 (data router) revienta sobre `jsdom`**

- Estado: **vigente**, y la mitigación sigue aplicada.
- Evidencia: `frontend/apps/coe/vitest.config.ts:11` y `frontend/apps/pmm/vitest.config.ts:11`
  → `environment: "happy-dom"`. `frontend/packages/api-client/vitest.config.ts:5` sigue en
  `jsdom`, coherente con el gotcha (ese paquete no navega).
- La condición que lo dispara sigue existiendo: **36 usos** de
  `RouterProvider`/`createMemoryRouter`/`createBrowserRouter` en `frontend/apps/`.
- Conclusión: si se agrega una app nueva que use el data router, hay que arrancarla en
  `happy-dom` desde el primer test, no descubrirlo después.

**G-02 — Tailwind v4 no escanea `node_modules` en un monorepo**

- Estado: **vigente**, mitigación aplicada en ambas apps.
- Evidencia: `frontend/apps/coe/src/index.css:7` y `frontend/apps/pmm/src/index.css:7` →
  `@source "../../../packages/api-client/src/**/*.{ts,tsx}";`
- Sigue siendo el riesgo señalado en `CLAUDE.md`: un tercer paquete de UI compartido sin su
  `@source` generaría 0 utilidades en el build de producción, con los tests en verde.

**G-03 — El teardown de la suite de backend recrea el esquema completo**

- Estado: **vigente**.
- Evidencia: `backend/tests/conftest.py:44` (`command.upgrade(cfg, "head")`), `:46`
  (`command.downgrade(cfg, "base")`) y `:60` (`TRUNCATE ... RESTART IDENTITY CASCADE` por test).
- Consecuencia práctica: la suite necesita un PostgreSQL real levantado (no SQLite) y tarda
  ~32 s. No es un defecto — es lo que hace que los triggers insert-only y los enums se prueben
  de verdad — pero explica el tiempo y por qué no corre "en frío" sin Docker.

**G-04 — `gcloud` no funciona desde Git Bash**

- Estado: **vigente y ampliado** — ver G-06.

---

## Ya no aplican

**G-05 — Un token vencido dejaba el Cliente COE en blanco, en un loop silencioso de 401**

- Estado: **resuelto**, el gotcha ya no reproduce.
- Evidencia: `frontend/apps/coe/src/apiClient.ts:17` implementa `onUnauthorized`, con la guarda
  de módulo `sesionVencidaNotificada` (`:12`, `:18-19`) para no disparar un `reload()` por cada
  llamada en paralelo que reciba el 401 — el polling de `usePolling` dispara varias por tick.
- Recomendación para el humano: el texto de `CLAUDE.md` ya dice "ya no aplica", pero el gotcha
  sigue descrito en la sección de gotchas de navegador. Se puede mover a un histórico para que no
  se lea como un problema abierto.

**G-06 — La migración `0005` sin aplicar en Cloud SQL**

- Estado: **resuelto**. Aplicada el 2026-08-21 21:49 UTC en la revisión `pce-backend-00022-zdn`.
- Evidencia: `DEPLOY-PLAN.md` sección 13, con el log de Alembic citado.

---

## Nuevos detectados

**N-01 — `InsecureKeyLengthWarning`: la clave HMAC del JWT tiene 21 bytes (mínimo recomendado: 32)**

- Severidad: **media**, y merece una verificación en producción.
- Evidencia: 61 warnings en la corrida, disparados desde
  `.venv/Lib/site-packages/jwt/api_jwt.py:147` y `:368`:
  `InsecureKeyLengthWarning: The HMAC key is 21 bytes long, which is below the minimum
  recommended length of 32 bytes for SHA256. See RFC 7518 Section 3.2.`
- Causa en la suite: el valor por defecto de `jwt_secret` (`app/core/config.py:4`,
  `"cambiar-en-produccion"`) mide exactamente 21 caracteres. En test eso es inocuo.
- **Lo que no se puede afirmar desde acá:** si el secreto real de producción
  (`pce-jwt-secret` en Secret Manager) tiene 32 bytes o más. El fail-safe de SEC-05 verifica que
  *no sea el valor por defecto*, pero **no verifica su longitud** — un secreto corto pasaría el
  chequeo igual.
- Acción sugerida para el humano: comprobar la longitud del secreto real y, si es menor a 32
  bytes, rotarlo. Considerar endurecer el validador de `Settings` para exigir
  `len(jwt_secret) >= 32` fuera de `local`/`test`, que convierte esto en un gate de arranque en
  vez de un warning que nadie lee.
- No estaba documentado en `CLAUDE.md`.

**N-02 — `DeprecationWarning` de Alembic: falta `path_separator` en la configuración**

- Severidad: **baja**, pero rompe en una versión futura.
- Evidencia: `.venv/Lib/site-packages/alembic/config.py:612`:
  `No path_separator found in configuration; falling back to legacy splitting on spaces, commas,
  and colons for prepend_sys_path. Consider adding path_separator=os to Alembic config.`
- Causa: `backend/alembic.ini` no declara `path_separator`. Hoy Alembic usa el modo legacy; cuando
  lo quite, el `prepend_sys_path` se va a partir distinto y las migraciones pueden dejar de
  encontrar el paquete `app`.
- Acción sugerida: agregar `path_separator = os` a `alembic.ini`. Es una línea y elimina el
  warning de las 32 corridas.
- No estaba documentado en `CLAUDE.md`.

**N-03 — Ningún test falló en la primera corrida**

- Severidad: **informativa**, pero vale registrarla.
- La guía de la sesión 09 marca como señal de alarma que toda la suite pase al primer intento sin
  haber visto nunca los tests fallar. Acá el contexto es distinto — son tests ya escritos y
  verificados en su momento con TDD, no recién creados — así que no es sospechoso por sí solo.
- Observación honesta: este harness **no** rompió el código a propósito para confirmar que los
  tests fallan. Si se quisiera esa garantía, hay que hacerlo explícitamente (mutación manual de
  una función crítica y confirmar el rojo). Queda anotado como límite de esta corrida, no como
  hallazgo.

---

## Resumen para el humano

| Acción | Dónde |
|---|---|
| Verificar la longitud del `pce-jwt-secret` real, y endurecer `Settings` si aplica | N-01 |
| Agregar `path_separator = os` a `backend/alembic.ini` | N-02 |
| Mover G-05 y G-06 a un histórico en `CLAUDE.md` — ya no son problemas abiertos | Ya no aplican |
| Mantener G-01 y G-02 visibles: son trampas que se repiten al agregar apps o paquetes | Vigentes |

Nada de esto se aplicó automáticamente. El harness solo escribió este archivo.
