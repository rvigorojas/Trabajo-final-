"""Derivación de nivel_alerta desde el campo de clasificación propio de cada
categoría no aeronáutica (PRD sección 8, confirmado con Renzo 2026-07-21).

Aeronáutica queda fuera: el PRD no confirma una derivación desde tipo_alerta
(1-10) hacia nivel_alerta I/II/III, así que ahí el nivel de alerta se recibe
directo del cliente en vez de derivarse acá.
"""

from app.models.activacion import NivelAlerta, TipoEmergencia

_EPIDEMIOLOGICA = {
    "EMERGENCIA": NivelAlerta.III,  # activación general
    "URGENCIA": NivelAlerta.II,  # activación parcial
    "CONSULTA": NivelAlerta.I,  # monitoreo
}

_ESTRUCTURAL_INCIDENTES = {
    "Estructural": NivelAlerta.III,  # activación general
    "Incidente": NivelAlerta.II,  # activación parcial
}

# MATPEL: toda activación dispara convocatoria general sin importar la clase UN
# registrada (criterio conservador, [Propuesto, 2026-07-21, a confirmar con el
# Jefe de Rescate] — TECH-DESIGN.md § Modelo de datos, planilla MATPEL 2026 vacía).
_CLASES_MATPEL = {f"Clase {n}" for n in range(1, 10)}


def derivar_nivel_alerta(tipo_emergencia: TipoEmergencia, clasificacion_origen: str) -> NivelAlerta:
    if tipo_emergencia == TipoEmergencia.EPIDEMIOLOGICA:
        try:
            return _EPIDEMIOLOGICA[clasificacion_origen]
        except KeyError:
            raise ValueError(
                f"clasificacion_origen inválida para Epidemiológica: {clasificacion_origen!r} "
                f"(esperado uno de {sorted(_EPIDEMIOLOGICA)})"
            ) from None
    if tipo_emergencia == TipoEmergencia.ESTRUCTURAL_INCIDENTES:
        try:
            return _ESTRUCTURAL_INCIDENTES[clasificacion_origen]
        except KeyError:
            raise ValueError(
                f"clasificacion_origen inválida para Estructural/Incidentes: "
                f"{clasificacion_origen!r} (esperado uno de {sorted(_ESTRUCTURAL_INCIDENTES)})"
            ) from None
    if tipo_emergencia == TipoEmergencia.MATPEL:
        if clasificacion_origen not in _CLASES_MATPEL:
            raise ValueError(
                f"clasificacion_origen inválida para MATPEL: {clasificacion_origen!r} "
                f"(esperado una de {sorted(_CLASES_MATPEL)})"
            )
        return NivelAlerta.III
    raise ValueError(f"{tipo_emergencia} no deriva nivel_alerta acá — se recibe directo")
