import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin
from app.models.usuario import Rol

if TYPE_CHECKING:
    from app.models.activacion import Activacion


class ConvocatoriaMiembro(TimestampMixin, Base):
    __tablename__ = "convocatoria_miembro"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    activacion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("activacion.id"), nullable=False
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False
    )
    # Snapshot del rol al momento de convocar (independiente de si el rol del
    # usuario cambia después) — coherente con "sin edición retroactiva" (ADR-2).
    rol: Mapped[Rol] = mapped_column(Enum(Rol, name="rol_convocatoria_miembro"), nullable=False)
    hora_confirmacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    activacion: Mapped["Activacion"] = relationship(back_populates="convocatoria")
