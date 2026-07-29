import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import UsuarioActual, get_current_usuario, get_db
from app.models.pre_pai import PrePAI
from app.schemas.pre_pai import PrePAICreate, PrePAIRead, PrePAIUpdate

router = APIRouter(prefix="/pre-pai", tags=["pre-pai"])


@router.post("", response_model=PrePAIRead, status_code=status.HTTP_201_CREATED)
async def crear_pre_pai(
    payload: PrePAICreate,
    db: AsyncSession = Depends(get_db),
    usuario: UsuarioActual = Depends(get_current_usuario),
) -> PrePAI:
    pre_pai = PrePAI(**payload.model_dump(), created_by=usuario.id)
    db.add(pre_pai)
    await db.commit()
    await db.refresh(pre_pai)
    return pre_pai


@router.get("", response_model=list[PrePAIRead])
async def listar_pre_pai(
    db: AsyncSession = Depends(get_db), _=Depends(get_current_usuario)
) -> list[PrePAI]:
    return (await db.execute(select(PrePAI))).scalars().all()


@router.put("/{pre_pai_id}", response_model=PrePAIRead)
async def actualizar_pre_pai(
    pre_pai_id: uuid.UUID,
    payload: PrePAIUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_usuario),
) -> PrePAI:
    """Catálogo editable (no es registro de incidente, sí admite UPDATE)."""
    pre_pai = await db.get(PrePAI, pre_pai_id)
    if pre_pai is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pre-PAI no encontrado")
    for campo, valor in payload.model_dump().items():
        setattr(pre_pai, campo, valor)
    await db.commit()
    await db.refresh(pre_pai)
    return pre_pai
