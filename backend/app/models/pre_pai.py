import uuid

from sqlalchemy import Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.activacion import TipoEmergencia
from app.models.mixins import TimestampMixin


class PrePAI(TimestampMixin, Base):
    """Plantilla de escenario, catálogo editable (no es registro de incidente,
    sí admite UPDATE) — accesible desde el menú aparte del cliente COE."""

    __tablename__ = "pre_pai"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nombre_escenario: Mapped[str] = mapped_column(String(200), nullable=False)
    sector: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo_emergencia: Mapped[TipoEmergencia] = mapped_column(
        Enum(TipoEmergencia, name="tipo_emergencia_pre_pai"), nullable=False
    )
    caracterizacion: Mapped[str] = mapped_column(String(1000), nullable=False)
    riesgos: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    contactos_emergencia: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    recursos: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    estrategias_control: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    plano_acceso: Mapped[str | None] = mapped_column(String(500), nullable=True)
    dimensiones_escenario: Mapped[str | None] = mapped_column(String(200), nullable=True)
