import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import ClientIdMixin, DobleTimestampMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.convocatoria_miembro import ConvocatoriaMiembro


class TipoEmergencia(str, enum.Enum):
    AERONAUTICA = "aeronautica"
    EPIDEMIOLOGICA = "epidemiologica"
    ESTRUCTURAL_INCIDENTES = "estructural_incidentes"
    MATPEL = "matpel"


class NivelAlerta(str, enum.Enum):
    I = "I"
    II = "II"
    III = "III"


class EstadoActivacion(str, enum.Enum):
    ACTIVA = "activa"
    CERRADA = "cerrada"


class Activacion(ClientIdMixin, DobleTimestampMixin, TimestampMixin, Base):
    """Sin UPDATE/DELETE (ADR-2): solo POST de inserción + trigger de DB."""

    __tablename__ = "activacion"
    # Índice único parcial "como máximo una fila ACTIVA a la vez" agregado en
    # la migración 0005 (raw SQL, ver su docstring) — no representado acá
    # porque SQLAlchemy no deriva bien un índice sobre una expresión
    # constante vía Base.metadata; mismo criterio que los triggers de las
    # migraciones 0002/0003.

    tipo_emergencia: Mapped[TipoEmergencia] = mapped_column(
        Enum(TipoEmergencia, name="tipo_emergencia"), nullable=False
    )
    nivel_alerta: Mapped[NivelAlerta] = mapped_column(
        Enum(NivelAlerta, name="nivel_alerta"), nullable=False
    )
    # Campo de clasificación propio por categoría (PRD sección 8, confirmado 2026-07-21) del
    # que se deriva nivel_alerta (services/clasificacion.py): triaje EMERGENCIA/URGENCIA/CONSULTA
    # en Epidemiológica, Incidente/Estructural en Estructural/Incidentes, Clasificación MATPEL
    # (Clase 1-9) en MATPEL. Nulo en Aeronáutica: el PRD no confirma una derivación desde
    # tipo_alerta (1-10) hacia nivel_alerta, así que ahí nivel_alerta se recibe directo.
    clasificacion_origen: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Solo Aeronáutica, en paralelo a nivel_alerta (no alternativo — PRD sección 3,
    # corrige una redacción previa del TDD que los presentaba como mutuamente excluyentes).
    tipo_alerta: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tipo_incidente: Mapped[str] = mapped_column(String(200), nullable=False)
    estado: Mapped[EstadoActivacion] = mapped_column(
        Enum(EstadoActivacion, name="estado_activacion"),
        default=EstadoActivacion.ACTIVA,
        nullable=False,
    )

    convocatoria: Mapped[list["ConvocatoriaMiembro"]] = relationship(
        back_populates="activacion", lazy="selectin"
    )
