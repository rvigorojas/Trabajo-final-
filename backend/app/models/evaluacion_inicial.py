import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import ClientIdMixin, DobleTimestampMixin, TimestampMixin


class EvaluacionInicial(ClientIdMixin, DobleTimestampMixin, TimestampMixin, Base):
    """Sin UPDATE/DELETE (ADR-2). El tipo de incidente vive en Activacion (Flujo B)."""

    __tablename__ = "evaluacion_inicial"

    activacion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activacion.id"), nullable=False
    )
    magnitud: Mapped[str] = mapped_column(String(500), nullable=False)
    riesgos_secundarios: Mapped[str | None] = mapped_column(String(1000), nullable=True)
