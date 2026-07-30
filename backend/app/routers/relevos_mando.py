import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import ROLES_EDICION_EVALUACION_RELEVO, UsuarioActual, get_current_usuario, get_db, require_role
from app.models.relevo_mando import RelevoMando
from app.schemas.relevo_mando import RelevoMandoCreate, RelevoMandoRead

router = APIRouter(prefix="/relevos-mando", tags=["relevos-mando"])


@router.post("", response_model=RelevoMandoRead, status_code=status.HTTP_201_CREATED)
async def crear_relevo_mando(
    payload: RelevoMandoCreate,
    db: AsyncSession = Depends(get_db),
    usuario: UsuarioActual = Depends(require_role(ROLES_EDICION_EVALUACION_RELEVO)),
) -> RelevoMando:
    relevo_id = payload.id or uuid.uuid4()

    existente = await db.get(RelevoMando, relevo_id)
    if existente is not None:  # idempotencia ADR-6
        return existente

    relevo = RelevoMando(
        id=relevo_id,
        activacion_id=payload.activacion_id,
        instancia=payload.instancia,
        responsable_saliente=payload.responsable_saliente,
        responsable_entrante=payload.responsable_entrante,
        hora_evento=payload.hora_evento,
        created_by=usuario.id,
    )
    relevo._audit_usuario_id = usuario.id
    db.add(relevo)
    await db.commit()
    await db.refresh(relevo)
    return relevo


@router.get("", response_model=list[RelevoMandoRead])
async def listar_relevos_mando(
    activacion_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_usuario),
) -> list[RelevoMando]:
    """Histórico de relevos — respalda la pestaña 'Cadena de mando' del COE.

    Filtrable por `activacion_id` (agregado 2026-07-30): sin el filtro, devuelve
    el historial completo de todas las activaciones, que era el único
    comportamiento posible antes de que este modelo tuviera `activacion_id`.
    """
    consulta = select(RelevoMando).order_by(RelevoMando.hora_recepcion)
    if activacion_id is not None:
        consulta = consulta.where(RelevoMando.activacion_id == activacion_id)
    result = await db.execute(consulta)
    return result.scalars().all()
