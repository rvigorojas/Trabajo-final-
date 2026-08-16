# Backend PCE — verificación local

Este backend se escribió sin poder correrlo en esta máquina (sin Docker/WSL2
instalados al momento de escribirlo). Los imports, la colección de tests con
pytest y `alembic history` ya se validaron sin necesitar una base real; lo
que sigue es la verificación de punta a punta contra Postgres.

## 1. Levantar Postgres

Desde la raíz del repo (`Trabajo-final-/`):

```
cp .env.example .env
docker compose up -d db
```

## 2. Migraciones

Desde `backend/`, con un entorno Python que tenga las dependencias instaladas
(`pip install -e ".[dev]"`, idealmente en un venv):

```
alembic upgrade head
```

Confirma que las tablas y los triggers de "sin edición retroactiva" (ADR-2)
se crean sin error.

## 3. Tests

```
pytest
```

Cubre: creación de cada recurso, auto-convocatoria en Alerta II/III con la
matriz de ejemplo (`app/services/seed.py`, `[Propuesto]`), idempotencia de
reintento por id (ADR-6), rechazo de `PUT`/`DELETE` (405) y del trigger de DB
(excepción) sobre las tablas insert-only, y last-write-wins de `Unidad`.

## 4. Levantar todo y probar manualmente

```
docker compose up
```

Con el backend arriba, `GET http://localhost:8000/docs` da la Swagger UI:

1. `POST /usuarios` — crear un usuario (ej. rol `jefe_rescate`).
2. `POST /auth/login` — obtener el JWT.
3. Usar el JWT (botón "Authorize" en Swagger) para probar `POST /activaciones`
   y confirmar que la convocatoria se genera sola en Alerta II/III.

**Verificado 2026-08-16** (esta sección nunca se había probado — el resto del
README sí, pero `docker compose up` con la imagen del backend, no). Hallazgo
real: el contenedor de `backend` arrancaba `uvicorn` directo, sin correr
migraciones, así que el `lifespan` de `app/main.py` (siembra de
`rol_convocatoria`) crasheaba contra una base recién creada sin tablas.
Arreglado con `backend/docker-entrypoint.sh` (`alembic upgrade head` antes de
`exec "$@"`) — con eso, este paso ya no necesita el paso 2 aparte, las
migraciones corren solas al levantar el contenedor. El paso 2 sigue haciendo
falta solo para correr el backend nativo (`uvicorn` directo, sin Docker).

## Pendiente conocido (no bloqueante, documentado en el plan aprobado)

- El esquema de columnas de `ReporteCierre` es genérico, no el de los 4
  Excel reales — completar contra el encabezado real de cada categoría.

## Historial de migraciones posteriores a la verificación inicial

- `0003_relevo_activacion_y_cierre` (2026-07-30): agrega `activacion_id` a
  `RelevoMando` (vía `Base.metadata`, no un `ADD COLUMN` — ver docstring de la
  migración) y reemplaza el trigger insert-only de `activacion` por uno que
  permite exactamente la transición `activa -> cerrada` (endpoint
  `POST /activaciones/{id}/desactivar`). Verificado contra Postgres real:
  14/14 tests (5 nuevos: `test_relevos_mando.py`, `test_desactivar_activacion.py`).
