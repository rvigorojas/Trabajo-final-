import uuid

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_usuario, get_db, get_or_404
from app.models.activacion import Activacion, TipoEmergencia
from app.models.convocatoria_miembro import ConvocatoriaMiembro
from app.models.evaluacion_inicial import EvaluacionInicial
from app.models.marcador_incidente import MarcadorIncidente
from app.models.reporte_cierre import ReporteCierre
from app.models.usuario import Usuario
from app.schemas.reporte_cierre import ReporteCierreCreate, ReporteCierreRead
from app.services.reporte_cierre import construir_datos_reporte_cierre, construir_workbook_reportes_cierre

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
    convocatoria = activacion.convocatoria
    usuarios = (
        (
            await db.execute(
                select(Usuario).where(
                    Usuario.id.in_([m.usuario_id for m in convocatoria])
                )
            )
        )
        .scalars()
        .all()
    )
    nombres_por_usuario_id = {u.id: u.nombre for u in usuarios}

    datos = construir_datos_reporte_cierre(
        activacion, evaluaciones, marcadores, convocatoria, nombres_por_usuario_id
    )

    reporte = ReporteCierre(
        activacion_id=activacion.id, tipo_emergencia=activacion.tipo_emergencia, datos=datos
    )
    db.add(reporte)
    await db.commit()
    await db.refresh(reporte)
    return reporte


@router.get("/exportar")
async def exportar_reportes_cierre(
    tipo_emergencia: TipoEmergencia,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_usuario),
) -> StreamingResponse:
    """Descarga el `.xlsx` real de una categoría (mismas columnas del Excel del Drive LAP).

    Reemplazo del "Cuadro Estadístico de Emergencias..." que hoy arma Rescate a mano: junta
    todos los `ReporteCierre` ya generados de la categoría en una sola hoja, en el orden real de
    columnas. El detalle operativo fuera de alcance del PCE v1 queda vacío para completar a mano.
    """
    reportes = (
        (
            await db.execute(
                select(ReporteCierre)
                .where(ReporteCierre.tipo_emergencia == tipo_emergencia)
                .order_by(ReporteCierre.generado_en)
            )
        )
        .scalars()
        .all()
    )
    contenido = construir_workbook_reportes_cierre(tipo_emergencia, reportes)
    nombre_archivo = f"cuadro-estadistico-{tipo_emergencia.value}.xlsx"
    return StreamingResponse(
        iter([contenido]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{nombre_archivo}"'},
    )


@router.get("/{reporte_id}", response_model=ReporteCierreRead)
async def obtener_reporte_cierre(
    reporte_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(get_current_usuario)
) -> ReporteCierre:
    return await get_or_404(db, ReporteCierre, reporte_id, "Reporte no encontrado")
