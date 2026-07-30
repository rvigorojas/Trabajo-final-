"""Permite la única transición de estado válida sobre Activacion (activa ->
cerrada), necesaria para el botón "Desactivar".

Dos huecos detectados el 2026-07-30 al escribir FRONTEND-SPEC.md (contrastando
TECH-DESIGN.md contra el código real, no solo contra la documentación):

1. `relevo_mando` no tenía `activacion_id` pese a que TECH-DESIGN.md ya
   describía la entidad con "activación asociada" — sin esto, la pestaña
   "Cadena de mando" del COE no puede filtrar el historial por incidente. Se
   agregó el campo en `app/models/relevo_mando.py`; **no hace falta un
   `ADD COLUMN` acá**: la migración 0001 delega en `Base.metadata.create_all()`
   (ver su propio docstring — es un espejo vivo de los modelos, no un DDL
   congelado), así que ya crea `relevo_mando` con `activacion_id` incluido en
   cualquier base nueva. Intentar agregarla de nuevo acá falla con
   `DuplicateColumnError` (verificado contra Postgres real).
2. No existía forma de cerrar una activación: el trigger insert-only de la
   migración 0002 bloqueaba CUALQUIER UPDATE sobre `activacion`, incluido el
   cambio legítimo de `estado` a `cerrada` que exige el botón "Desactivar"
   (presente en las 5 variantes de navegación de Tablet_app_structures.pptx).
   Se reemplaza el trigger genérico de `activacion` por uno dedicado que
   permite exactamente esa transición (activa -> cerrada, sin tocar ningún
   otro campo) y sigue rechazando cualquier otro UPDATE/DELETE — preserva la
   intención de ADR-2 ("sin edición retroactiva NO AUDITADA") sin bloquear una
   transición de negocio legítima y auditada (ver app/db/audit.py). Esta parte
   sí es un cambio real de esta migración: los triggers de la 0002 son SQL
   crudo, no derivan de `Base.metadata`.

Revision ID: 0003_relevo_activacion_y_cierre
Revises: 0002_no_retroactive_triggers
Create Date: 2026-07-30
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0003_relevo_activacion_y_cierre"
down_revision: Union[str, None] = "0002_no_retroactive_triggers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TRIGGER_ACTIVACION = "trg_bloquear_edicion_activacion"

FUNCION_CIERRE_ACTIVACION = """
CREATE OR REPLACE FUNCTION fn_bloquear_edicion_activacion()
RETURNS trigger AS $$
BEGIN
    -- SQLAlchemy guarda el NAME del enum de Python (mayúsculas), no su
    -- .value usado en el JSON de la API (EstadoActivacion.ACTIVA = "activa"
    -- pero la columna guarda 'ACTIVA') — verificado contra Postgres real.
    IF TG_OP = 'UPDATE'
       AND OLD.estado = 'ACTIVA' AND NEW.estado = 'CERRADA'
       AND NEW.id = OLD.id
       AND NEW.tipo_emergencia = OLD.tipo_emergencia
       AND NEW.nivel_alerta = OLD.nivel_alerta
       AND NEW.clasificacion_origen IS NOT DISTINCT FROM OLD.clasificacion_origen
       AND NEW.tipo_alerta IS NOT DISTINCT FROM OLD.tipo_alerta
       AND NEW.tipo_incidente = OLD.tipo_incidente
       AND NEW.hora_evento = OLD.hora_evento
       AND NEW.hora_recepcion = OLD.hora_recepcion
       AND NEW.created_at = OLD.created_at
       AND NEW.created_by IS NOT DISTINCT FROM OLD.created_by
    THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION
        'Tabla activacion es insert-only salvo el cierre (activa->cerrada): UPDATE/DELETE no permitido (ADR-2)';
END;
$$ LANGUAGE plpgsql;
"""


def upgrade() -> None:
    op.execute(f"DROP TRIGGER IF EXISTS {TRIGGER_ACTIVACION} ON activacion;")
    op.execute(FUNCION_CIERRE_ACTIVACION)
    op.execute(
        f"""
        CREATE TRIGGER {TRIGGER_ACTIVACION}
        BEFORE UPDATE OR DELETE ON activacion
        FOR EACH ROW EXECUTE FUNCTION fn_bloquear_edicion_activacion();
        """
    )


def downgrade() -> None:
    op.execute(f"DROP TRIGGER IF EXISTS {TRIGGER_ACTIVACION} ON activacion;")
    op.execute("DROP FUNCTION IF EXISTS fn_bloquear_edicion_activacion();")
    op.execute(
        f"""
        CREATE TRIGGER {TRIGGER_ACTIVACION}
        BEFORE UPDATE OR DELETE ON activacion
        FOR EACH ROW EXECUTE FUNCTION fn_bloquear_edicion_retroactiva();
        """
    )
