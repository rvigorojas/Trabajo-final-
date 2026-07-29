from httpx import AsyncClient

from app.models.usuario import Rol
from tests.conftest import ahora_iso, auth_headers, crear_usuario_y_login


async def _crear_activacion(client: AsyncClient, token: str) -> str:
    resp = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "aeronautica",
            "nivel_alerta": "II",
            "tipo_alerta": 2,
            "tipo_incidente": "Prueba RBAC",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    return resp.json()["id"]


async def test_m4_no_puede_registrar_evaluacion_inicial(client: AsyncClient):
    token_jefe = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.rbac")
    activacion_id = await _crear_activacion(client, token_jefe)

    token_m4 = await crear_usuario_y_login(client, Rol.M4, "m4.rbac")
    resp = await client.post(
        "/evaluaciones-iniciales",
        json={
            "activacion_id": activacion_id,
            "magnitud": "Media",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token_m4),
    )
    assert resp.status_code == 403


async def test_jefe_de_rescate_si_puede_registrar_evaluacion_inicial(client: AsyncClient):
    token_jefe = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.rbac2")
    activacion_id = await _crear_activacion(client, token_jefe)

    resp = await client.post(
        "/evaluaciones-iniciales",
        json={
            "activacion_id": activacion_id,
            "magnitud": "Media",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token_jefe),
    )
    assert resp.status_code == 201, resp.text
