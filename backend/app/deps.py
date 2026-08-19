import uuid
from collections.abc import Callable
from typing import Any, TypeVar

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.base import get_session
from app.models.usuario import Rol, Usuario

ModeloT = TypeVar("ModeloT")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


class UsuarioActual:
    """Claims del JWT ya validado — evita un round-trip a la DB en cada request
    (ADR-7: rol/permisos viajan como claims para que el cliente PMM los valide
    localmente; el backend hace lo mismo con lo ya firmado)."""

    def __init__(self, id: uuid.UUID, rol: Rol, instancia_principal: str):
        self.id = id
        self.rol = rol
        self.instancia_principal = instancia_principal


async def get_current_usuario(token: str = Depends(oauth2_scheme)) -> UsuarioActual:
    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado"
        )
    return UsuarioActual(
        id=uuid.UUID(payload["sub"]),
        rol=Rol(payload["rol"]),
        instancia_principal=payload["instancia_principal"],
    )


# PRD sección 7: "la edición de la evaluación inicial y del relevo de mando queda
# reservada al CI (PMM) y al Coordinador/suplentes (COE)". El PRD sección 2 define la
# cadena de mando de cada lado (quien puede llegar a ser CI o Coordinador), no un campo
# dinámico de "quién es el CI ahora" — se aproxima acá con un allowlist estático por rol
# (simplificación conocida: un Supervisor de Rescate que aún no asumió como CI también
# pasaría este check; resolverlo con precisión requeriría rastrear el CI activo por
# activación, fuera de alcance de esta fase backend-only).
ROLES_EDICION_EVALUACION_RELEVO = [
    Rol.JEFE_RESCATE,
    Rol.SUPERVISOR_GRAL_RESCATE,
    Rol.SUPERVISOR_RESCATE,
    Rol.GERENTE_SEGURIDAD,
    Rol.GERENTE_OPERACIONES_AEROPORTUARIAS,
    Rol.DUTY_MANAGER,
]

# PRD sección 5: el Coordinador del Plan de Emergencia (Gerente de Seguridad; en su
# ausencia, Gerente de Operaciones Aeroportuarias; en su ausencia, Duty Manager) es
# quien decide activación/desactivación — no el CI/PMM. Agregado 2026-07-30 junto
# con el endpoint de cierre de activación (hueco detectado en FRONTEND-SPEC.md).
ROLES_DESACTIVACION = [
    Rol.GERENTE_SEGURIDAD,
    Rol.GERENTE_OPERACIONES_AEROPORTUARIAS,
    Rol.DUTY_MANAGER,
]

# security-pass 2026-08-19, SEC-06: GET /usuarios exponía nombre/rol/contacto de toda
# la nómina a cualquier rol autenticado. Se restringe al mismo grupo que ya puede
# desactivar activaciones, más el rol admin nuevo (SEC-01).
ROLES_GESTION_USUARIOS = [Rol.ADMIN, *ROLES_DESACTIVACION]


def require_role(roles_permitidos: list[Rol]) -> Callable:
    async def _checker(usuario: UsuarioActual = Depends(get_current_usuario)) -> UsuarioActual:
        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rol {usuario.rol.value} no autorizado para esta acción",
            )
        return usuario

    return _checker


async def get_db() -> AsyncSession:
    async for session in get_session():
        yield session


async def get_usuario_por_username(db: AsyncSession, username: str) -> Usuario | None:
    result = await db.execute(select(Usuario).where(Usuario.username == username))
    return result.scalar_one_or_none()


async def get_or_404(
    db: AsyncSession,
    modelo: type[ModeloT],
    id_: Any,
    mensaje: str,
    *,
    options: list[Any] | None = None,
) -> ModeloT:
    """Busca `modelo` por su PK; si no existe, corta con 404 y `mensaje`.

    Centraliza el patrón `db.get(...) -> if None: raise HTTPException(404, ...)`
    que estaba duplicado igual en activaciones.py, pre_pai.py y reportes_cierre.py
    (Sesión 07: refactor por señal de "validaciones repetidas en varios lugares",
    no un fix de bug — el comportamiento observable no cambia).
    """
    instancia = await db.get(modelo, id_, options=options)
    if instancia is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, mensaje)
    return instancia
