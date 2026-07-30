import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import ClientIdMixin, DobleTimestampMixin, TimestampMixin


class Instancia(str, enum.Enum):
    COE = "coe"
    PMM_CI = "pmm_ci"


class RelevoMando(ClientIdMixin, DobleTimestampMixin, TimestampMixin, Base):
    """Sin UPDATE/DELETE (ADR-2, ADR-6) — inmutable una vez confirmado."""

    __tablename__ = "relevo_mando"

    # Agregado 2026-07-30: TECH-DESIGN.md ya describía esta entidad con
    # "activación asociada" pero el modelo real no la tenía — sin esto, la
    # pestaña "Cadena de mando" del COE (Design.md, Flujo B) no puede filtrar
    # el historial por incidente (detectado al escribir FRONTEND-SPEC.md).
    activacion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activacion.id"), nullable=False
    )
    instancia: Mapped[Instancia] = mapped_column(Enum(Instancia, name="instancia"), nullable=False)
    responsable_saliente: Mapped[str] = mapped_column(String(200), nullable=False)
    responsable_entrante: Mapped[str] = mapped_column(String(200), nullable=False)
