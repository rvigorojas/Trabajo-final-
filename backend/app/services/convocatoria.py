"""Auto-convocatoria en Alerta II/III (criterio de aceptación del TDD,
§ Activación de emergencia): convoca automáticamente a los miembros de COE y
PMM que correspondan, sin selección manual uno por uno.

La matriz de "qué rol se convoca en qué nivel/categoría" se resuelve contra
la tabla configurable `RolConvocatoria`, sembrada con la matriz real de
GSEG-L-001 § 4.2.2 para Aeronáutica (extendida por decisión de Renzo a las
otras 3 categorías, que el plan no cubre — ver seed_rol_convocatoria en
app/services/seed.py para el detalle y la cita exacta), reemplazable sin
tocar código.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activacion import Activacion, NivelAlerta
from app.models.convocatoria_miembro import ConvocatoriaMiembro
from app.models.rol_convocatoria import RolConvocatoria
from app.models.usuario import Usuario

NIVELES_CON_AUTOCONVOCATORIA = {NivelAlerta.II, NivelAlerta.III}


async def auto_convocar(db: AsyncSession, activacion: Activacion) -> list[ConvocatoriaMiembro]:
    if activacion.nivel_alerta not in NIVELES_CON_AUTOCONVOCATORIA:
        return []

    roles = (
        (
            await db.execute(
                select(RolConvocatoria.rol).where(
                    RolConvocatoria.tipo_emergencia == activacion.tipo_emergencia,
                    RolConvocatoria.nivel_alerta == activacion.nivel_alerta,
                )
            )
        )
        .scalars()
        .all()
    )
    if not roles:
        return []

    usuarios = (
        (await db.execute(select(Usuario).where(Usuario.rol.in_(roles), Usuario.activo.is_(True))))
        .scalars()
        .all()
    )

    miembros = [
        ConvocatoriaMiembro(activacion_id=activacion.id, usuario_id=usuario.id, rol=usuario.rol)
        for usuario in usuarios
    ]
    db.add_all(miembros)
    return miembros
