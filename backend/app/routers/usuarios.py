from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_usuario, get_db
from app.core.security import hash_password
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioRead

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.post("", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
async def crear_usuario(payload: UsuarioCreate, db: AsyncSession = Depends(get_db)) -> Usuario:
    # NOTA: sin auth por ahora — bootstrap de cuentas en esta fase backend-only.
    # Antes de cualquier despliegue real, restringir a un rol admin (fuera de
    # alcance: no hay concepto de "admin" en el PRD/TDD, solo roles operativos).
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
    db: AsyncSession = Depends(get_db), _=Depends(get_current_usuario)
) -> list[Usuario]:
    return (await db.execute(select(Usuario))).scalars().all()
