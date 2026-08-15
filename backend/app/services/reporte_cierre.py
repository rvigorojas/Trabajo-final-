"""Esquema real de columnas de `ReporteCierre.datos`, por categoría.

Fuente: los 4 "Cuadro Estadístico de Emergencias..." reales del Drive LAP
(carpeta "Excel atenciones"), hoja "Base de Datos"/"Base de datos", fila de
encabezado — extraídos con openpyxl el 2026-08-15, no de una copia parafraseada.
Cada lista reproduce el nombre y el orden EXACTOS de esas columnas (incluidos
saltos de línea y espacios sueltos ya presentes en el Excel real, ej. "Tipo ").

La mayoría de estas columnas registran detalle operativo/administrativo que
el PCE v1 no captura (personal por función, contratistas, diagnósticos
médicos, equipo usado, etc. — explícitamente fuera de alcance v1, PRD sección
6: "Digitalización completa de los formatos de inspección diaria" y similares
quedan fuera). `construir_datos_reporte_cierre` solo autocompleta las
columnas con una correspondencia directa e inequívoca a un campo ya
registrado por el PCE; el resto queda en `None`, a completar manualmente por
el equipo de Rescate al exportar — igual que hoy exigen los propios Excel
para el detalle que no captura ningún sistema.

Nota técnica: el orden real de estas columnas lo define la lista de abajo,
no el orden de claves de `datos` en Postgres — `jsonb` no garantiza
preservar el orden de inserción de un objeto (documentado por Postgres). Un
exportador real a Excel/CSV (no construido todavía) debe iterar
`COLUMNAS_REPORTE_CIERRE[categoría]` y leer cada valor de `datos` por nombre,
no asumir el orden en que Postgres devuelve las claves del JSONB.
"""

import uuid
from collections.abc import Iterable

from app.models.activacion import Activacion, TipoEmergencia
from app.models.convocatoria_miembro import ConvocatoriaMiembro
from app.models.evaluacion_inicial import EvaluacionInicial
from app.models.marcador_incidente import MarcadorIncidente
from app.models.usuario import Rol

COLUMNAS_REPORTE_CIERRE: dict[TipoEmergencia, list[str]] = {
    TipoEmergencia.AERONAUTICA: [
        "N° Parte",
        "Fecha",
        "Mes",
        "Supervisor de Rescate M6",
        "Supervisor Gral de Rescate M3",
        "Cantidad de Asistentes SEI",
        "Hora Aviso",
        "Hora Arribo",
        "Hora Término",
        "Tiempo total de atención",
        "Total Horas Hombre",
        "Compañía Aérea",
        "Tipo de Aeronave",
        "Problema",
        "Sub Problema (Consecuencia)",
        "Detalle / Observaciones",
        "Tipo de Alerta",
        "Pista",
        "Tipo de vuelo",
        "Matrícula",
        "Nombre CTA",
        "Grupo",
        "M4 / M7",
        "Nombre",
        "Observaciones",
        "Revisión\n(No llenar)",
        "Estación",
        "Terminal",
    ],
    TipoEmergencia.ESTRUCTURAL_INCIDENTES: [
        "Base",
        "N° de Orden",
        "Fecha",
        "Mes",
        "¿ASISTE SPI?",
        "PI-1",
        "PI-2",
        "PI-3",
        "Cantidad asistentes SPI",
        "Se movilizó VIR SPI",
        "Hora Inicio",
        "Hora Término",
        "Tiempo total de atención",
        "Total Horas Hombre",
        "Lugar",
        "Zona",
        "Nivel",
        "Incidente / Estructural",
        "Tipo ",
        "¿Fue falsa alarma?",
        "Si se activó un detector de humo, indicar el código",
        "Descripción y Observaciones",
        "Origen",
        "Contratista o Concesionario",
        "¿ASISTE SSEI?",
        "¿Qué unidad SSEI asiste?",
        "Piloto VIR SSEI",
        "Líder de Dotación SSEI",
        "Cantidad de Asistentes SEI",
        "M4 / M7",
        "Grupo",
        "Correlativo Sup SSEI",
        "Revisión           (No llenar)",
    ],
    TipoEmergencia.MATPEL: [
        "Base",
        "N° de Reporte",
        "Fecha",
        "Mes",
        "Cantidad de Unidades Asistentes",
        "Piloto VIR",
        "Al Mando",
        "Cantidad de Asistentes",
        "Hora Inicio",
        "Hora Término",
        "Total Horas",
        "Total Horas Hombre",
        'Clasificación MATPEL\n(Si es "otros" detallar en la columna siguiente)',
        "Otros (Detallar)",
        "Descripción de la emergencia",
        "Trabajos efectuados",
        "Contratista o Concesionario",
        "M4 / M7",
        "Nombre",
    ],
    TipoEmergencia.EPIDEMIOLOGICA: [
        "Base",
        "HAM",
        "Fecha",
        "Mes",
        "\nHora de recepción de llamada",
        "Hora que llegó a la atención personal médico",
        "Fin de la atención",
        "Tiempo de respuesta",
        "¿Demora por espera en PEA?",
        "Lugar de atención",
        "Zona",
        "Nivel",
        "Pasajero solicitó atención",
        "Total de minutos en atención",
        "Punto de partida de CM y/o motivo de tardanza",
        "Paciente",
        "Nacionalidad",
        "Edad en años",
        "Tipo de paciente",
        "Tipo_de_paciente",
        "Empresa /Aerolínea",
        "Personal que solicita la atención",
        "Código Diagnostico 1",
        "Diagnóstico 1",
        "Código Diagnostico 2",
        "Diagnóstico 2",
        "Código Diagnostico 3",
        "Diagnóstico 3",
        "Clasificación de la emergencia",
        "Traslado /Lugar",
        "En caso de traslado, indicar hora que INICIA EL TRASLADO",
        "En caso de traslado, indicar hora que REGRESÓ la ambulancia a LAP",
        "Indicar hora que se incorpora nueva ambulancia. En caso se demore la ambulancia en el traslado",
        "Fallecido",
        "Origen de la Atención Médica",
        "Nombre perosnal Triaje (Nombre y Apellido)",
        "Nombre perosnal de Rescate",
        "Equipo (A, B, C)",
        "¿Se usó DEA?",
        "¿El DEA inicialmente estuvo disponible?",
        "¿Se usó biombo?",
        "Unidad médica que lo atiende",
        "Se requiere apoyo de personal SAI",
        "Nombre personal SAI",
        "Se requiere apoyo de personal SPI",
        "Nombre personal SPI",
        "Se requiere apoyo de personal SSEI",
        "Nombre personal SSEI",
        "Observaciones",
        "Rango Horario",
        "Automate",
        "ERROR",
    ],
}


def _nombres_por_rol(
    convocatoria: Iterable[ConvocatoriaMiembro],
    nombres_por_usuario_id: dict[uuid.UUID, str],
    *roles: Rol,
) -> str | None:
    nombres = [
        nombres_por_usuario_id[m.usuario_id]
        for m in convocatoria
        if m.rol in roles and m.usuario_id in nombres_por_usuario_id
    ]
    return ", ".join(nombres) if nombres else None


def _texto_evaluacion(evaluaciones: Iterable[EvaluacionInicial]) -> str | None:
    partes = [
        f"{e.magnitud} ({e.riesgos_secundarios})" if e.riesgos_secundarios else e.magnitud
        for e in evaluaciones
    ]
    return "; ".join(partes) if partes else None


def _coordenada_marcador(marcadores: Iterable[MarcadorIncidente]) -> str | None:
    for m in marcadores:
        return m.coordenada_cuadricula
    return None


def construir_datos_reporte_cierre(
    activacion: Activacion,
    evaluaciones: list[EvaluacionInicial],
    marcadores: list[MarcadorIncidente],
    convocatoria: list[ConvocatoriaMiembro],
    nombres_por_usuario_id: dict[uuid.UUID, str],
) -> dict[str, str | int | None]:
    columnas = COLUMNAS_REPORTE_CIERRE[activacion.tipo_emergencia]
    datos: dict[str, str | int | None] = dict.fromkeys(columnas)

    fecha = activacion.hora_evento.date().isoformat()
    mes = activacion.hora_evento.month
    hora = activacion.hora_evento.strftime("%H:%M")
    m4_m7 = _nombres_por_rol(convocatoria, nombres_por_usuario_id, Rol.M4, Rol.M7)
    texto_evaluacion = _texto_evaluacion(evaluaciones)

    if activacion.tipo_emergencia is TipoEmergencia.AERONAUTICA:
        datos["Fecha"] = fecha
        datos["Mes"] = mes
        datos["Hora Aviso"] = hora
        datos["Supervisor de Rescate M6"] = _nombres_por_rol(
            convocatoria, nombres_por_usuario_id, Rol.SUPERVISOR_RESCATE
        )
        datos["Supervisor Gral de Rescate M3"] = _nombres_por_rol(
            convocatoria, nombres_por_usuario_id, Rol.SUPERVISOR_GRAL_RESCATE
        )
        datos["Problema"] = activacion.tipo_incidente
        datos["Detalle / Observaciones"] = texto_evaluacion
        datos["Tipo de Alerta"] = activacion.tipo_alerta
        datos["M4 / M7"] = m4_m7

    elif activacion.tipo_emergencia is TipoEmergencia.ESTRUCTURAL_INCIDENTES:
        datos["Fecha"] = fecha
        datos["Mes"] = mes
        datos["Hora Inicio"] = hora
        datos["Lugar"] = _coordenada_marcador(marcadores)
        # "Incidente / Estructural" es el campo real del que ya deriva
        # nivel_alerta (PRD sección 8) — no confundir con la columna "Nivel"
        # del Excel, que en los datos reales es el piso del edificio
        # (ej. "Piso 3 (P30)"), un dato que el PCE no registra.
        datos["Incidente / Estructural"] = activacion.clasificacion_origen
        datos["Tipo "] = activacion.tipo_incidente
        datos["Descripción y Observaciones"] = texto_evaluacion
        datos["M4 / M7"] = m4_m7

    elif activacion.tipo_emergencia is TipoEmergencia.MATPEL:
        datos["Fecha"] = fecha
        datos["Mes"] = mes
        datos["Hora Inicio"] = hora
        # Clasificación de 9 categorías UN ya registrada tal cual (PRD
        # sección 8) — se registra sin mapeo a nivel de activación.
        datos['Clasificación MATPEL\n(Si es "otros" detallar en la columna siguiente)'] = (
            activacion.clasificacion_origen
        )
        datos["Descripción de la emergencia"] = activacion.tipo_incidente
        datos["Trabajos efectuados"] = texto_evaluacion
        datos["M4 / M7"] = m4_m7

    elif activacion.tipo_emergencia is TipoEmergencia.EPIDEMIOLOGICA:
        datos["Fecha"] = fecha
        datos["Mes"] = mes
        datos["\nHora de recepción de llamada"] = hora
        datos["Lugar de atención"] = _coordenada_marcador(marcadores)
        # Triaje EMERGENCIA/URGENCIA/CONSULTA ya registrado (PRD sección 8),
        # del que ya deriva nivel_alerta — coincide con la columna real
        # "Clasificación de la emergencia" del propio Excel.
        datos["Clasificación de la emergencia"] = activacion.clasificacion_origen
        datos["Observaciones"] = texto_evaluacion

    return datos
