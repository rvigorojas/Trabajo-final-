import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LogAuditoria(Base):
    """Append-only: quién, cuándo, sobre qué entidad (ADR-2). Poblada
    automáticamente por los event listeners de app/db/audit.py, nunca por los
    routers directamente."""

    __tablename__ = "log_auditoria"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tabla: Mapped[str] = mapped_column(String(100), nullable=False)
    registro_id: Mapped[str] = mapped_column(String(100), nullable=False)
    accion: Mapped[str] = mapped_column(String(20), nullable=False)  # insert / update
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    detalle: Mapped[dict] = mapped_column(JSONB, nullable=False)
