import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import ClientIdMixin, DobleTimestampMixin, TimestampMixin


class CapaMapa(str, enum.Enum):
    CUADRICULA = "cuadricula"
    INCIDENTE = "incidente"
    ACCESOS = "accesos"
    UNIDADES_FASE2 = "unidades_fase2"


class MarcadorIncidente(ClientIdMixin, DobleTimestampMixin, TimestampMixin, Base):
    """Sin UPDATE/DELETE (ADR-2). estado_sincronizado es el badge del Flujo C
    (Design.md) que el cliente PMM muestra junto al marcador hasta reconectar."""

    __tablename__ = "marcador_incidente"

    activacion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activacion.id"), nullable=False
    )
    coordenada_cuadricula: Mapped[str] = mapped_column(String(50), nullable=False)
    tipo_incidente: Mapped[str] = mapped_column(String(200), nullable=False)
    riesgo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    capa: Mapped[CapaMapa] = mapped_column(Enum(CapaMapa, name="capa_mapa"), nullable=False)
    estado_sincronizado: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
