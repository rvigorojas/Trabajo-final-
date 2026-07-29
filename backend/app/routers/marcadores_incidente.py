import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import UsuarioActual, get_current_usuario, get_db
from app.models.marcador_incidente import MarcadorIncidente
from app.schemas.marcador_incidente import MarcadorIncidenteCreate, MarcadorIncidenteRead

router = APIRouter(prefix="/marcadores-incidente", tags=["marcadores-incidente"])


@router.post("", response_model=MarcadorIncidenteRead, status_code=status.HTTP_201_CREATED)
async def crear_marcador_incidente(
    payload: MarcadorIncidenteCreate,
    db: AsyncSession = Depends(get_db),
    usuario: UsuarioActual = Depends(get_current_usuario),
) -> MarcadorIncidente:
    marcador_id = payload.id or uuid.uuid4()

    existente = await db.get(MarcadorIncidente, marcador_id)
    if existente is not None:  # idempotencia ADR-6
        return existente

    # estado_sincronizado=True: quien llega hasta acá ya sincronizó con éxito.
    # El badge "sin sincronizar" (Flujo C, Design.md) es estado local del
    # cliente PMM mientras el POST todavía no se confirmó.
    marcador = MarcadorIncidente(
        id=marcador_id,
        activacion_id=payload.activacion_id,
        coordenada_cuadricula=payload.coordenada_cuadricula,
        tipo_incidente=payload.tipo_incidente,
        riesgo=payload.riesgo,
        capa=payload.capa,
        hora_evento=payload.hora_evento,
        created_by=usuario.id,
    )
    marcador._audit_usuario_id = usuario.id
    db.add(marcador)
    await db.commit()
    await db.refresh(marcador)
    return marcador


@router.get("", response_model=list[MarcadorIncidenteRead])
async def listar_marcadores_incidente(
    db: AsyncSession = Depends(get_db), _=Depends(get_current_usuario)
) -> list[MarcadorIncidente]:
    return (await db.execute(select(MarcadorIncidente))).scalars().all()
