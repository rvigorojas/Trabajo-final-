import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_usuario, get_db, get_or_404
from app.models.activacion import Activacion
from app.models.evaluacion_inicial import EvaluacionInicial
from app.models.marcador_incidente import MarcadorIncidente
from app.models.reporte_cierre import ReporteCierre
from app.schemas.reporte_cierre import ReporteCierreCreate, ReporteCierreRead

router = APIRouter(prefix="/reportes-cierre", tags=["reportes-cierre"])


@router.post("", response_model=ReporteCierreRead, status_code=status.HTTP_201_CREATED)
async def crear_reporte_cierre(
    payload: ReporteCierreCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_usuario)
) -> ReporteCierre:
    activacion = await get_or_404(db, Activacion, payload.activacion_id, "Activación no encontrada")

    existente = (
        await db.execute(
            select(ReporteCierre).where(ReporteCierre.activacion_id == activacion.id)
        )
    ).scalar_one_or_none()
    if existente is not None:
        return existente

    evaluaciones = (
        (
            await db.execute(
                select(EvaluacionInicial).where(EvaluacionInicial.activacion_id == activacion.id)
            )
        )
        .scalars()
        .all()
    )
    marcadores = (
        (
            await db.execute(
                select(MarcadorIncidente).where(MarcadorIncidente.activacion_id == activacion.id)
            )
        )
        .scalars()
        .all()
    )

    # NOTA: columnas genéricas, no las reales del Excel de cada categoría (ver
    # comentario en app/models/reporte_cierre.py) — completar contra el
    # encabezado real (Drive LAP) al construir el exportador definitivo.
    datos = {
        "tipo_emergencia": activacion.tipo_emergencia.value,
        "nivel_alerta": activacion.nivel_alerta.value,
        "tipo_incidente": activacion.tipo_incidente,
        "hora_evento": activacion.hora_evento.isoformat(),
        "evaluaciones_iniciales": [
            {"magnitud": e.magnitud, "riesgos_secundarios": e.riesgos_secundarios}
            for e in evaluaciones
        ],
        "marcadores_incidente": [
            {"coordenada_cuadricula": m.coordenada_cuadricula, "tipo_incidente": m.tipo_incidente}
            for m in marcadores
        ],
    }

    reporte = ReporteCierre(
        activacion_id=activacion.id, tipo_emergencia=activacion.tipo_emergencia, datos=datos
    )
    db.add(reporte)
    await db.commit()
    await db.refresh(reporte)
    return reporte


@router.get("/{reporte_id}", response_model=ReporteCierreRead)
async def obtener_reporte_cierre(
    reporte_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_usuario)
) -> ReporteCierre:
    return await get_or_404(db, ReporteCierre, reporte_id, "Reporte no encontrado")
