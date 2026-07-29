import enum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import ClientIdMixin, DobleTimestampMixin, TimestampMixin


class Instancia(str, enum.Enum):
    COE = "coe"
    PMM_CI = "pmm_ci"


class RelevoMando(ClientIdMixin, DobleTimestampMixin, TimestampMixin, Base):
    """Sin UPDATE/DELETE (ADR-2, ADR-6) — inmutable una vez confirmado."""

    __tablename__ = "relevo_mando"

    instancia: Mapped[Instancia] = mapped_column(Enum(Instancia, name="instancia"), nullable=False)
    responsable_saliente: Mapped[str] = mapped_column(String(200), nullable=False)
    responsable_entrante: Mapped[str] = mapped_column(String(200), nullable=False)
