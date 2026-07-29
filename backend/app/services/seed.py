"""Datos de ejemplo para RolConvocatoria (ver services/convocatoria.py).

[Propuesto, 2026-07-21, a confirmar con Renzo/Jefe de Rescate]: no existe en
este repo la matriz real de convocatoria de GSEG-L-001. Estos son valores de
ejemplo razonables (mismo criterio para las 4 categorías) para que el
mecanismo sea probable de punta a punta; reemplazar por fila real sin tocar
código (tabla `rol_convocatoria`, admite INSERT/UPDATE/DELETE normal).
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activacion import NivelAlerta, TipoEmergencia
from app.models.rol_convocatoria import RolConvocatoria
from app.models.usuario import Rol

_ROLES_ALERTA_II = [Rol.DUTY_MANAGER, Rol.SUPERVISOR_GRAL_RESCATE, Rol.SGO]
_ROLES_ALERTA_III = [
    Rol.GERENTE_SEGURIDAD,
    Rol.GERENTE_OPERACIONES_AEROPORTUARIAS,
    Rol.JEFE_RESCATE,
    Rol.SUPERVISOR_GRAL_RESCATE,
    Rol.SGO,
    Rol.M4,
    Rol.M7,
]


async def seed_rol_convocatoria(db: AsyncSession) -> None:
    ya_sembrado = (await db.execute(select(RolConvocatoria.id).limit(1))).first()
    if ya_sembrado is not None:
        return

    filas = [
        RolConvocatoria(tipo_emergencia=categoria, nivel_alerta=NivelAlerta.II, rol=rol)
        for categoria in TipoEmergencia
        for rol in _ROLES_ALERTA_II
    ] + [
        RolConvocatoria(tipo_emergencia=categoria, nivel_alerta=NivelAlerta.III, rol=rol)
        for categoria in TipoEmergencia
        for rol in _ROLES_ALERTA_III
    ]
    db.add_all(filas)
    await db.commit()
