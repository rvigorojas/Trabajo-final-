"""Matriz de convocatoria real (ver services/convocatoria.py).

Fuente: GSEG-L-001 "Plan de Emergencia del Aeropuerto Internacional Jorge
Chávez", v.001 (29/04/2025), § 4.2.2 "Alerta y activación del COE" (listas
"Miembros del COE/PMM en la Activación Parcial" para Alerta II, y
"Activación general" para Alerta III) + Anexo 1 (organigrama). El documento
solo define esta lista de miembros para emergencias **aeronáuticas**.
Epidemiológica, Estructural/Incidentes y MATPEL no tienen una matriz de
convocatoria propia en el plan (sus secciones — 4.2.6/4.2.7 — describen
acciones de respuesta, no listas de convocados). Aplicado inicialmente como
supuesto de Renzo (2026-08-15) y **confirmado por el Jefe de Rescate el
2026-08-17**: se usa la misma matriz aeronáutica para las 4 categorías.

No incluye los roles de mando (Coordinador del Plan de Emergencia y sus
suplentes — Gerente de Seguridad/Gerente de Operaciones Aeroportuarias/Duty
Manager — ni el Jefe de Rescate como Comandante de Incidente): el plan los
trata como quienes ordenan/lideran la activación, no como "convocados"
adicionales.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activacion import NivelAlerta, TipoEmergencia
from app.models.rol_convocatoria import RolConvocatoria
from app.models.usuario import Rol

# GSEG-L-001 § 4.2.2.b — "Miembros del COE en la Activación Parcial" +
# "Miembros del PMM en la Activación Parcial" (unión, sin duplicar
# Supervisor Gral. de Seguridad de la Aviación, que el plan lista en ambos).
_ROLES_ALERTA_II = [
    Rol.SUPERVISOR_GRAL_SEGURIDAD_PATRIMONIAL,
    Rol.SUPERVISOR_GRAL_SEGURIDAD_AVIACION,
    Rol.SGO,
    Rol.SUPERVISOR_GRAL_TERMINALES,
    Rol.SUPERVISOR_GRAL_CCA,
    Rol.INGENIERO_TURNO,
    Rol.SUPERVISOR_GRAL_RESCATE,
    Rol.SUPERVISOR_RESCATE,
    Rol.SERVICIO_MEDICO,
    Rol.SUPERVISOR_GRAL_OPERACIONES_LADO_AIRE,
]

# GSEG-L-001 § 4.2.2.c — todo lo de Alerta II, más los 3 miembros clave que
# el plan agrega en la Activación General (con posibilidad de conexión
# remota). Los organismos externos (CGBVP, PNP, DIRESA, DGAC, FF.AA., etc.)
# que el plan también suma en Alerta III no entran acá: se registran como
# "organismos externos" al margen de RolConvocatoria (PRD sección 6, fuera
# de alcance su gestión de despacho).
_ROLES_ALERTA_III = _ROLES_ALERTA_II + [
    Rol.GERENTE_REPUTACION,
    Rol.GERENTE_RRHH,
    Rol.GERENTE_LOGISTICA,
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
