"""Auditoría automática vía event listeners de SQLAlchemy (ADR-2).

Los mapper events after_insert/after_update reciben la Connection Core del
flush en curso, así que registrar ahí el log de auditoría funciona igual con
AsyncSession (el flush real ocurre en el greenlet síncrono subyacente) sin
necesitar código async en el listener ni llamadas manuales repetidas en cada
router.

Cada modelo puede llevar un atributo transitorio `_audit_usuario_id` (seteado
por el router antes de `commit()`) para registrar quién hizo el cambio.
"""

from sqlalchemy import event, insert

from app.models.convocatoria_miembro import ConvocatoriaMiembro
from app.models.log_auditoria import LogAuditoria
from app.models.activacion import Activacion
from app.models.evaluacion_inicial import EvaluacionInicial
from app.models.marcador_incidente import MarcadorIncidente
from app.models.relevo_mando import RelevoMando
from app.models.unidad import Unidad


def _registrar(connection, target, accion: str, detalle: dict) -> None:
    connection.execute(
        insert(LogAuditoria.__table__).values(
            tabla=target.__tablename__,
            registro_id=str(_id_de(target)),
            accion=accion,
            usuario_id=getattr(target, "_audit_usuario_id", None),
            detalle=detalle,
        )
    )


def _id_de(target) -> str:
    if hasattr(target, "id"):
        return target.id
    return target.identificador  # Unidad usa identificador como PK


def _after_insert(mapper, connection, target) -> None:
    _registrar(connection, target, "insert", _snapshot(target))


def _after_update(mapper, connection, target) -> None:
    _registrar(connection, target, "update", _snapshot(target))


def _snapshot(target) -> dict:
    return {
        c.key: str(getattr(target, c.key))
        for c in target.__table__.columns
        if getattr(target, c.key, None) is not None
    }


def registrar_listeners_auditoria() -> None:
    for modelo in (
        Activacion,
        EvaluacionInicial,
        RelevoMando,
        MarcadorIncidente,
        ConvocatoriaMiembro,
    ):
        event.listen(modelo, "after_insert", _after_insert)

    event.listen(Unidad, "after_insert", _after_insert)
    event.listen(Unidad, "after_update", _after_update)
