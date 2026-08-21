"""Índice único parcial: como máximo una Activacion en estado ACTIVA a la vez.

Walkthrough real 2026-08-19: el backend no impedía crear una 2da "Nueva
activación" mientras ya había una ACTIVA. La más vieja desaparecía de toda la
UI (Resumen, Cadena de mando, Reportes, que solo resuelven "la activación en
curso" como la más reciente) pero quedaba ACTIVA en la base para siempre, sin
ningún botón que la alcance — ni Desactivar ni ningún otro camino en la app.

No se representa en `app/models/activacion.py` vía `Base.metadata` (mismo
criterio que los triggers de las migraciones 0002/0003): un índice único
parcial sobre una expresión constante no es algo que SQLAlchemy derive bien
de forma declarativa, así que se crea acá con SQL crudo, igual que los
triggers existentes.

Antes de crear el índice, si ya hay más de una fila ACTIVA en la base (dato
real, no hipotético — es exactamente el bug que se está corrigiendo), la
migración se detiene con un mensaje claro en vez de cerrar filas en silencio:
cerrar una activación sin pasar por `POST /activaciones/{id}/desactivar`
significa que nunca se genera su `ReporteCierre`, así que es una decisión de
negocio (cuál activación "gana"), no algo para resolver a ciegas en una
migración.

Revision ID: 0005_una_activacion_activa
Revises: 0004_add_admin_rol
Create Date: 2026-08-21

Nota: el id de revisión original ("...a_la_vez") tenía 35 caracteres y no
entraba en `alembic_version.version_num` (VARCHAR(32)) — mismo bug ya
documentado en 0001 (ver bitácora), acortado acá antes de aplicar la
migración por primera vez en ningún entorno.
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0005_una_activacion_activa"
down_revision: Union[str, None] = "0004_add_admin_rol"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDICE = "uq_activacion_unica_activa"

VERIFICACION = f"""
DO $$
DECLARE
    activas INT;
BEGIN
    SELECT COUNT(*) INTO activas FROM activacion WHERE estado = 'ACTIVA';
    IF activas > 1 THEN
        RAISE EXCEPTION
            'Hay % activaciones en estado ACTIVA a la vez — resolver manualmente '
            '(POST /activaciones/{{id}}/desactivar sobre las que no correspondan) '
            'antes de aplicar la migración {revision}',
            activas;
    END IF;
END $$;
"""


def upgrade() -> None:
    op.execute(VERIFICACION)
    op.execute(
        f"""
        CREATE UNIQUE INDEX IF NOT EXISTS {INDICE}
        ON activacion ((1))
        WHERE estado = 'ACTIVA';
        """
    )


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {INDICE};")
