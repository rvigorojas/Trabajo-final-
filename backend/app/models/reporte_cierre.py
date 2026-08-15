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
    nombre, mismo orden) — encabezado real extraído del Drive LAP y
    construido en app/services/reporte_cierre.py (`COLUMNAS_REPORTE_CIERRE`
    + `construir_datos_reporte_cierre`, 2026-08-15). La mayoría de las
    columnas reales quedan en `None`: registran detalle operativo que el PCE
    v1 no captura (fuera de alcance, PRD sección 6); solo se autocompletan
    las que tienen una correspondencia directa a un campo ya registrado.
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
