from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_usuario, get_db
from app.models.unidad import Unidad
from app.schemas.unidad import UnidadRead, UnidadUpsert

router = APIRouter(prefix="/unidades", tags=["unidades"])


@router.get("", response_model=list[UnidadRead])
async def listar_unidades(
    db: AsyncSession = Depends(get_db), _=Depends(get_current_usuario)
) -> list[Unidad]:
    return (await db.execute(select(Unidad).order_by(Unidad.identificador))).scalars().all()


@router.put("/{identificador}", response_model=UnidadRead)
async def actualizar_unidad(
    identificador: str,
    payload: UnidadUpsert,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_usuario),
) -> Unidad:
    """Last-write-wins por hora_recepcion (ADR-6): cada PUT sobrescribe sin
    comparar — el orden real de llegada al backend ya implementa
    last-write-wins, sin necesitar lógica de resolución de conflictos."""
    unidad = await db.get(Unidad, identificador)
    if unidad is None:
        unidad = Unidad(identificador=identificador, estado=payload.estado)
        db.add(unidad)
    else:
        unidad.estado = payload.estado
    await db.commit()
    await db.refresh(unidad)
    return unidad
