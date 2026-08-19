from httpx import AsyncClient

from app.models.usuario import Rol
from app.services.reporte_cierre import COLUMNAS_REPORTE_CIERRE
from tests.conftest import ahora_iso, auth_headers, crear_usuario_y_login


async def _crear_activacion(client: AsyncClient, token: str) -> str:
    resp = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "aeronautica",
            "nivel_alerta": "II",
            "tipo_alerta": 2,
            "tipo_incidente": "Prueba desactivar",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    return resp.json()["id"]


async def test_jefe_de_rescate_no_puede_desactivar(client: AsyncClient):
    """Desactivar es decisión del Coordinador del Plan de Emergencia (COE), no del CI (PRD sección 5)."""
    token = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.desact")
    activacion_id = await _crear_activacion(client, token)

    resp = await client.post(f"/activaciones/{activacion_id}/desactivar", headers=auth_headers(token))
    assert resp.status_code == 403


async def test_gerente_seguridad_puede_desactivar(client: AsyncClient):
    token_jefe = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.desact2")
    activacion_id = await _crear_activacion(client, token_jefe)

    token_coordinador = await crear_usuario_y_login(
        client, Rol.GERENTE_SEGURIDAD, "gerente.seguridad.desact"
    )
    resp = await client.post(
        f"/activaciones/{activacion_id}/desactivar", headers=auth_headers(token_coordinador)
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["estado"] == "cerrada"


async def test_desactivar_es_idempotente(client: AsyncClient):
    token_jefe = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.desact3")
    activacion_id = await _crear_activacion(client, token_jefe)

    token_coordinador = await crear_usuario_y_login(
        client, Rol.DUTY_MANAGER, "duty.manager.desact"
    )
    primera = await client.post(
        f"/activaciones/{activacion_id}/desactivar", headers=auth_headers(token_coordinador)
    )
    segunda = await client.post(
        f"/activaciones/{activacion_id}/desactivar", headers=auth_headers(token_coordinador)
    )
    assert primera.status_code == 200
    assert segunda.status_code == 200
    assert segunda.json()["estado"] == "cerrada"


async def test_desactivar_genera_el_reporte_de_cierre_sola(client: AsyncClient):
    """Desde este cambio, desactivar genera el ReporteCierre solo, sin el click manual de ReportesScreen."""
    token_jefe = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.desact4")
    activacion_id = await _crear_activacion(client, token_jefe)

    token_coordinador = await crear_usuario_y_login(
        client, Rol.DUTY_MANAGER, "duty.manager.desact2"
    )
    resp_desactivar = await client.post(
        f"/activaciones/{activacion_id}/desactivar", headers=auth_headers(token_coordinador)
    )
    assert resp_desactivar.status_code == 200

    # POST /reportes-cierre ahora solo consulta/reintenta: debe devolver el
    # mismo reporte ya generado, sin duplicarlo (idempotente por activacion_id).
    resp_reporte = await client.post(
        "/reportes-cierre", json={"activacion_id": activacion_id}, headers=auth_headers(token_coordinador)
    )
    assert resp_reporte.status_code == 201
    datos = resp_reporte.json()["datos"]
    assert set(datos.keys()) == set(COLUMNAS_REPORTE_CIERRE["aeronautica"])
    assert datos["Problema"] == "Prueba desactivar"
