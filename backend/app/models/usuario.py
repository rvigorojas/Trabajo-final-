import enum
import uuid

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class Rol(str, enum.Enum):
    """Roles del Plan de Emergencia (PRD sección 5).

    Los 9 roles debajo de SERVICIO_MEDICO no estaban en el enum original
    (acotado a la cadena de mando de Rescate/PMM) y se agregaron el
    2026-08-15 al sembrar la matriz real de convocatoria de GSEG-L-001
    § 4.2.2 (Anexo 1 — organigrama del Plan de Emergencia), que sí lista
    supervisores de COE fuera de esa cadena. Ver app/services/seed.py.
    """

    # Agregado 2026-08-19 (security-pass, SEC-01): rol técnico de administración de
    # cuentas, sin equivalente en el Plan de Emergencia — no participa en convocatoria
    # ni en ninguna matriz operativa, solo en la creación/gestión de usuarios del PCE.
    ADMIN = "admin"
    GERENTE_SEGURIDAD = "gerente_seguridad"
    GERENTE_OPERACIONES_AEROPORTUARIAS = "gerente_operaciones_aeroportuarias"
    DUTY_MANAGER = "duty_manager"
    JEFE_RESCATE = "jefe_rescate"
    SUPERVISOR_GRAL_RESCATE = "supervisor_gral_rescate"
    SUPERVISOR_RESCATE = "supervisor_rescate"
    M4 = "m4"
    M7 = "m7"
    SGO = "sgo"
    BOMBERO_AERONAUTICO = "bombero_aeronautico"
    SERVICIO_MEDICO = "servicio_medico"
    SUPERVISOR_GRAL_SEGURIDAD_PATRIMONIAL = "supervisor_gral_seguridad_patrimonial"
    SUPERVISOR_GRAL_SEGURIDAD_AVIACION = "supervisor_gral_seguridad_aviacion"
    SUPERVISOR_GRAL_TERMINALES = "supervisor_gral_terminales"
    SUPERVISOR_GRAL_CCA = "supervisor_gral_cca"
    INGENIERO_TURNO = "ingeniero_turno"
    SUPERVISOR_GRAL_OPERACIONES_LADO_AIRE = "supervisor_gral_operaciones_lado_aire"
    GERENTE_REPUTACION = "gerente_reputacion"
    GERENTE_RRHH = "gerente_rrhh"
    GERENTE_LOGISTICA = "gerente_logistica"


class InstanciaPrincipal(str, enum.Enum):
    COE = "coe"
    PMM = "pmm"


class Usuario(TimestampMixin, Base):
    __tablename__ = "usuario"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    # Credenciales de acceso (TDD § Modelo de datos, "Usuario"): username usado en /auth/login.
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    rol: Mapped[Rol] = mapped_column(Enum(Rol, name="rol"), nullable=False)
    instancia_principal: Mapped[InstanciaPrincipal] = mapped_column(
        Enum(InstanciaPrincipal, name="instancia_principal"), nullable=False
    )
    contacto: Mapped[str | None] = mapped_column(String(200), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
