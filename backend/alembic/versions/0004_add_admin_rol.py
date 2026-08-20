"""Agrega 'ADMIN' al enum `rol` en bases ya desplegadas (security-pass, SEC-01).

El rol `ADMIN` se agregó a `app/models/usuario.py` el 2026-08-19 (ver
`Usuario.Rol`, SEC-01: `POST /usuarios` ahora exige ese rol). En una base
NUEVA esto no requiere migración aparte: la 0001 deriva el `CREATE TYPE rol`
completo de `Base.metadata` en cada corrida, así que ya incluye `ADMIN`. Pero
Cloud SQL real (`pce-db`) ya tenía las migraciones 0001-0003 aplicadas antes
de este cambio — `alembic upgrade head` en el próximo deploy no vuelve a
correr la 0001, así que el enum real se queda sin `ADMIN` sin esta migración
incremental.

`ADD VALUE IF NOT EXISTS` cubre los dos casos con la misma migración: en una
base nueva (0001 ya trae `ADMIN`) es un no-op; en Cloud SQL real, lo agrega.
Postgres 12+ permite `ALTER TYPE ... ADD VALUE` dentro de una transacción
(el valor nuevo solo no puede *usarse* en esa misma transacción, y esta
migración no lo usa, solo lo declara) — verificado contra Postgres 16 local.

`downgrade()` es un no-op: Postgres no soporta remover un valor de un enum
(no existe `DROP VALUE`) — la única vía real sería recrear el tipo desde
cero (fuera de alcance acá). Dejar 'ADMIN' en el tipo tras un downgrade no
rompe nada (un valor de enum sin filas que lo usen es inofensivo); además el
teardown de la suite de tests (`conftest.py`, fixture `_schema`) hace
`alembic downgrade base` al final de cada corrida — si esta migración
lanzara un error acá, rompería ese teardown para toda la suite, no solo
para un test puntual (verificado: falló así antes de este ajuste).

Revision ID: 0004_add_admin_rol
Revises: 0003_relevo_activacion_y_cierre
Create Date: 2026-08-19
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0004_add_admin_rol"
down_revision: Union[str, None] = "0003_relevo_activacion_y_cierre"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE rol ADD VALUE IF NOT EXISTS 'ADMIN';")


def downgrade() -> None:
    pass
