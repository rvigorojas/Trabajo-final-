import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import ROLES_EDICION_EVALUACION_RELEVO, UsuarioActual, get_current_usuario, get_db, require_role
from app.models.evaluacion_inicial import EvaluacionInicial
from app.schemas.evaluacion_inicial import EvaluacionInicialCreate, EvaluacionInicialRead

router = APIRouter(prefix="/evaluaciones-iniciales", tags=["evaluaciones-iniciales"])


@router.post("", response_model=EvaluacionInicialRead, status_code=status.HTTP_201_CREATED)
async def crear_evaluacion_inicial(
    payload: EvaluacionInicialCreate,
    db: AsyncSession = Depends(get_db),
    usuario: UsuarioActual = Depends(require_role(ROLES_EDICION_EVALUACION_RELEVO)),
) -> EvaluacionInicial:
    evaluacion_id = payload.id or uuid.uuid4()

    existente = await db.get(EvaluacionInicial, evaluacion_id)
    if existente is not None:  # idempotencia ADR-6
        return existente

    evaluacion = EvaluacionInicial(
        id=evaluacion_id,
        activacion_id=payload.activacion_id,
        magnitud=payload.magnitud,
        riesgos_secundarios=payload.riesgos_secundarios,
        hora_evento=payload.hora_evento,
        created_by=usuario.id,
    )
    evaluacion._audit_usuario_id = usuario.id
    db.add(evaluacion)
    await db.commit()
    await db.refresh(evaluacion)
    return evaluacion


@router.get("", response_model=list[EvaluacionInicialRead])
async def listar_evaluaciones_iniciales(
    db: AsyncSession = Depends(get_db), _=Depends(get_current_usuario)
) -> list[EvaluacionInicial]:
    return (await db.execute(select(EvaluacionInicial))).scalars().all()
