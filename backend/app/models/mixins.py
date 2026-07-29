import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class TimestampMixin:
    """created_at/created_by comunes a todas las entidades (ADR-2)."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)


class DobleTimestampMixin:
    """hora_evento (dispositivo) / hora_recepcion (backend) — ADR-2.

    El orden de auditoría y el last-write-wins de Unidad (ADR-6) usan siempre
    hora_recepcion: un reloj de tablet desincronizado no debe poder alterar el
    orden real de los eventos.
    """

    hora_evento: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    hora_recepcion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ClientIdMixin:
    """PK generada por el cliente (UUID) para las entidades insert-only.

    Permite que el reintento de un POST con el mismo id (ADR-6: cola offline
    del PMM reconectando) sea idempotente en vez de duplicar la fila.
    """

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
