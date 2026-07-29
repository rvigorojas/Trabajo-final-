import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EstadoUnidad(str, enum.Enum):
    OK = "ok"
    FUERA_DE_SERVICIO = "fuera_de_servicio"
    NO_APLICA = "no_aplica"


class Unidad(Base):
    """Único registro mutable del modelo (ADR-6): identificador (R1, R2, R8-R13,
    CR9) como PK natural, estado last-write-wins por hora_recepcion.

    No lleva hora_evento propio (ADR-2): cada PUT asigna hora_recepcion=now() y
    sobrescribe sin comparar — el orden de llegada real al backend ya
    implementa last-write-wins por diseño.
    """

    __tablename__ = "unidad"

    identificador: Mapped[str] = mapped_column(String(20), primary_key=True)
    estado: Mapped[EstadoUnidad] = mapped_column(
        Enum(EstadoUnidad, name="estado_unidad"), nullable=False
    )
    hora_recepcion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
