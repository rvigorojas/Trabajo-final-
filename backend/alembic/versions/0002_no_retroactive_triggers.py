"""Triggers Postgres: rechazar UPDATE/DELETE en tablas insert-only (ADR-2).

Respaldo a nivel de base de datos del mecanismo de "sin edición retroactiva"
—la capa de aplicación (routers sin PUT/PATCH/DELETE) es la primera defensa;
esto cubre el caso de que algo además de la API toque la base directamente
(ej. un script de mantenimiento mal escrito).

Revision ID: 0002_no_retroactive_triggers
Revises: 0001_initial_schema
Create Date: 2026-07-28
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0002_no_retroactive_triggers"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLAS_INSERT_ONLY = (
    "activacion",
    "evaluacion_inicial",
    "relevo_mando",
    "marcador_incidente",
)

FUNCION = """
CREATE OR REPLACE FUNCTION fn_bloquear_edicion_retroactiva()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION
        'Tabla % es insert-only: UPDATE/DELETE no permitido (ADR-2)',
        TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
"""


def upgrade() -> None:
    op.execute(FUNCION)
    for tabla in TABLAS_INSERT_ONLY:
        op.execute(
            f"""
            CREATE TRIGGER trg_bloquear_edicion_{tabla}
            BEFORE UPDATE OR DELETE ON {tabla}
            FOR EACH ROW EXECUTE FUNCTION fn_bloquear_edicion_retroactiva();
            """
        )


def downgrade() -> None:
    for tabla in TABLAS_INSERT_ONLY:
        op.execute(f"DROP TRIGGER IF EXISTS trg_bloquear_edicion_{tabla} ON {tabla};")
    op.execute("DROP FUNCTION IF EXISTS fn_bloquear_edicion_retroactiva();")
