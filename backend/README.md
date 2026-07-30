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

## Pendiente conocido (no bloqueante, documentado en el plan aprobado)

- La matriz de auto-convocatoria (`rol_convocatoria`) tiene datos de ejemplo,
  no la lista real de GSEG-L-001 — reemplazable sin tocar código.
- La ventana de 12h del token "blando" (ADR-7) es lógica de cliente PMM, que
  todavía no existe.
- El esquema de columnas de `ReporteCierre` es genérico, no el de los 4
  Excel reales — completar contra el encabezado real de cada categoría.
- Reconciliar la cola offline del PMM cuando el JWT ya expiró al reconectar
  no está resuelto (el backend valida el JWT de cada request sin excepción)
  — ver `FRONTEND-SPEC.md` sección 6.4.

## Historial de migraciones posteriores a la verificación inicial

- `0003_relevo_activacion_y_cierre` (2026-07-30): agrega `activacion_id` a
  `RelevoMando` (vía `Base.metadata`, no un `ADD COLUMN` — ver docstring de la
  migración) y reemplaza el trigger insert-only de `activacion` por uno que
  permite exactamente la transición `activa -> cerrada` (endpoint
  `POST /activaciones/{id}/desactivar`). Verificado contra Postgres real:
  14/14 tests (5 nuevos: `test_relevos_mando.py`, `test_desactivar_activacion.py`).
