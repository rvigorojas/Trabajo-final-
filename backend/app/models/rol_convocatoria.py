import uuid

from sqlalchemy import Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.activacion import NivelAlerta, TipoEmergencia
from app.models.usuario import Rol


class RolConvocatoria(Base):
    """Mecanismo de configuración (no está en el TDD original): una fila por
    (categoría, nivel de alerta, rol a convocar). No existe en el repo la
    matriz real de GSEG-L-001 — se siembra con datos de ejemplo
    [Propuesto, a confirmar con Renzo/Jefe de Rescate] y es editable sin tocar
    código (tabla de catálogo, admite UPDATE/DELETE)."""

    __tablename__ = "rol_convocatoria"
    __table_args__ = (
        UniqueConstraint("tipo_emergencia", "nivel_alerta", "rol", name="uq_rol_convocatoria"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tipo_emergencia: Mapped[TipoEmergencia] = mapped_column(
        Enum(TipoEmergencia, name="tipo_emergencia_rol_convocatoria"), nullable=False
    )
    nivel_alerta: Mapped[NivelAlerta] = mapped_column(
        Enum(NivelAlerta, name="nivel_alerta_rol_convocatoria"), nullable=False
    )
    rol: Mapped[Rol] = mapped_column(Enum(Rol, name="rol_rol_convocatoria"), nullable=False)
