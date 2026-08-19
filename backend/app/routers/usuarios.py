from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import ROLES_GESTION_USUARIOS, get_current_usuario, get_db, require_role
from app.core.security import hash_password
from app.models.usuario import Rol, Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioRead

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# security-pass 2026-08-19, SEC-01: POST /usuarios no exigía ninguna autenticación y
# dejaba elegir el rol libremente — cualquiera podía crearse una cuenta con rol
# gerente_seguridad/duty_manager y desactivar activaciones reales. `auto_error=False`
# porque el endpoint sigue aceptando el caso sin token (solo cuando la tabla usuario
# está vacía — bootstrap del primer admin, ver abajo).
_token_opcional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


@router.post("", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
async def crear_usuario(
    payload: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    token: str | None = Depends(_token_opcional),
) -> Usuario:
    hay_usuarios = (await db.execute(select(Usuario.id).limit(1))).first() is not None

    if hay_usuarios:
        if token is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Requiere autenticación")
        usuario_actual = await get_current_usuario(token)
        if usuario_actual.rol != Rol.ADMIN:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Rol {usuario_actual.rol.value} no autorizado para esta acción",
            )
    elif payload.rol != Rol.ADMIN:
        # Bootstrap: el primer usuario del sistema (tabla vacía) se crea sin auth,
        # pero solo puede ser el admin fundador — no cualquier rol operativo.
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "El primer usuario del sistema debe crearse con rol admin",
        )

    existente = await db.execute(select(Usuario).where(Usuario.username == payload.username))
    if existente.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "username ya existe")

    usuario = Usuario(
        nombre=payload.nombre,
        username=payload.username,
        password_hash=hash_password(payload.password),
        rol=payload.rol,
        instancia_principal=payload.instancia_principal,
        contacto=payload.contacto,
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario


@router.get("", response_model=list[UsuarioRead])
async def listar_usuarios(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role(ROLES_GESTION_USUARIOS)),
) -> list[Usuario]:
    # security-pass 2026-08-19, SEC-06: exponía nombre/rol/contacto de toda la
    # nómina a cualquier rol autenticado — restringido a roles de gestión.
    return (await db.execute(select(Usuario))).scalars().all()
