import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.deps import (
    ROLES_DESACTIVACION,
    UsuarioActual,
    get_current_usuario,
    get_db,
    get_or_404,
    require_role,
)
from app.models.activacion import Activacion, EstadoActivacion, TipoEmergencia
from app.models.convocatoria_miembro import ConvocatoriaMiembro
from app.schemas.activacion import ActivacionConConvocatoria, ActivacionCreate, ActivacionRead
from app.schemas.convocatoria_miembro import ConvocatoriaMiembroRead
from app.services.clasificacion import derivar_nivel_alerta
from app.services.convocatoria import auto_convocar

router = APIRouter(prefix="/activaciones", tags=["activaciones"])


@router.post("", response_model=ActivacionConConvocatoria, status_code=status.HTTP_201_CREATED)
async def crear_activacion(
    payload: ActivacionCreate,
    db: AsyncSession = Depends(get_db),
    usuario: UsuarioActual = Depends(get_current_usuario),
) -> Activacion:
    activacion_id = payload.id or uuid.uuid4()

    # Idempotencia (ADR-6): un reintento de la cola offline del PMM con el mismo
    # id no debe duplicar la activación ni volver a disparar la convocatoria.
    existente = await db.get(
        Activacion, activacion_id, options=[selectinload(Activacion.convocatoria)]
    )
    if existente is not None:
        return existente

    if payload.tipo_emergencia == TipoEmergencia.AERONAUTICA:
        nivel_alerta = payload.nivel_alerta
    else:
        try:
            nivel_alerta = derivar_nivel_alerta(payload.tipo_emergencia, payload.clasificacion_origen)
        except ValueError as exc:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from None

    activacion = Activacion(
        id=activacion_id,
        tipo_emergencia=payload.tipo_emergencia,
        nivel_alerta=nivel_alerta,
        clasificacion_origen=payload.clasificacion_origen,
        tipo_alerta=payload.tipo_alerta,
        tipo_incidente=payload.tipo_incidente,
        hora_evento=payload.hora_evento,
        created_by=usuario.id,
    )
    activacion._audit_usuario_id = usuario.id
    db.add(activacion)
    await db.flush()  # asigna hora_recepcion antes de la auto-convocatoria

    miembros = await auto_convocar(db, activacion)
    for miembro in miembros:
        miembro._audit_usuario_id = usuario.id

    await db.commit()
    await db.refresh(activacion, attribute_names=["convocatoria"])
    return activacion


@router.get("", response_model=list[ActivacionConConvocatoria])
async def listar_activaciones(
    db: AsyncSession = Depends(get_db), _=Depends(get_current_usuario)
) -> list[Activacion]:
    result = await db.execute(select(Activacion).options(selectinload(Activacion.convocatoria)))
    return result.scalars().all()


@router.get("/{activacion_id}", response_model=ActivacionConConvocatoria)
async def obtener_activacion(
    activacion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_usuario),
) -> Activacion:
    return await get_or_404(
        db,
        Activacion,
        activacion_id,
        "Activación no encontrada",
        options=[selectinload(Activacion.convocatoria)],
    )


@router.post("/{activacion_id}/desactivar", response_model=ActivacionRead)
async def desactivar_activacion(
    activacion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    usuario: UsuarioActual = Depends(require_role(ROLES_DESACTIVACION)),
) -> Activacion:
    """Única transición de estado permitida sobre una Activacion (activa -> cerrada).

    Agregado 2026-07-30 (hueco detectado en FRONTEND-SPEC.md): Activacion es
    insert-only (ADR-2) salvo esta excepción explícita, reforzada por el
    trigger de DB de la migración 0003 (que solo permite este cambio puntual
    de `estado`, ningún otro campo). Idempotente: desactivar una activación ya
    cerrada no falla, simplemente devuelve el estado actual.
    """
    activacion = await get_or_404(db, Activacion, activacion_id, "Activación no encontrada")
    if activacion.estado == EstadoActivacion.CERRADA:
        return activacion
    activacion.estado = EstadoActivacion.CERRADA
    activacion._audit_usuario_id = usuario.id
    await db.commit()
    await db.refresh(activacion)
    return activacion


@router.post(
    "/{activacion_id}/convocatoria/{miembro_id}/confirmar",
    response_model=ConvocatoriaMiembroRead,
)
async def confirmar_convocatoria(
    activacion_id: uuid.UUID,
    miembro_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_usuario),
) -> ConvocatoriaMiembro:
    miembro = await db.get(ConvocatoriaMiembro, miembro_id)
    if miembro is None or miembro.activacion_id != activacion_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Miembro convocado no encontrado")
    if miembro.hora_confirmacion is None:
        miembro.hora_confirmacion = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(miembro)
    return miembro
