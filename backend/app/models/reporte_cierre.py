import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.activacion import TipoEmergencia
from app.models.mixins import TimestampMixin


class ReporteCierre(TimestampMixin, Base):
    """Snapshot exportable de una activación cerrada.

    `datos` guarda pares columna->valor. El TDD exige que las columnas
    reproduzcan exactamente las del Excel actual de cada categoría (mismo
    nombre, mismo orden) — ese encabezado real (Drive LAP) no está verificado
    en este repo, así que no se hardcodea acá: se completa al construir el
    exportador real, columna por columna, contra el Excel de cada categoría.
    """

    __tablename__ = "reporte_cierre"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    activacion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activacion.id"), nullable=False
    )
    tipo_emergencia: Mapped[TipoEmergencia] = mapped_column(
        Enum(TipoEmergencia, name="tipo_emergencia_reporte_cierre"), nullable=False
    )
    generado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    datos: Mapped[dict] = mapped_column(JSONB, nullable=False)
