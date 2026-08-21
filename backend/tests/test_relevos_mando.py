from httpx import AsyncClient

from app.models.usuario import Rol
from tests.conftest import ahora_iso, auth_headers, crear_usuario_y_login


async def _crear_activacion(client: AsyncClient, token: str, tipo_incidente: str) -> str:
    resp = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "aeronautica",
            "nivel_alerta": "II",
            "tipo_alerta": 2,
            "tipo_incidente": tipo_incidente,
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    return resp.json()["id"]


async def test_relevo_mando_requiere_activacion_id(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.relevo1")
    activacion_id = await _crear_activacion(client, token, "Prueba relevo 1")

    resp = await client.post(
        "/relevos-mando",
        json={
            "activacion_id": activacion_id,
            "instancia": "pmm_ci",
            "responsable_saliente": "Sup. Gral. Rescate",
            "responsable_entrante": "Jefe de Rescate",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["activacion_id"] == activacion_id


async def test_listar_relevos_mando_filtra_por_activacion(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.relevo2")
    duty_token = await crear_usuario_y_login(client, Rol.DUTY_MANAGER, "duty.relevo2")
    activacion_a = await _crear_activacion(client, token, "Incidente A")
    # No puede haber 2 activaciones ACTIVA a la vez (migración 0005) — se
    # desactiva la primera antes de crear la segunda, igual que haría la app real.
    await client.post(f"/activaciones/{activacion_a}/desactivar", headers=auth_headers(duty_token))
    activacion_b = await _crear_activacion(client, token, "Incidente B")

    for activacion_id, saliente in ((activacion_a, "A-saliente"), (activacion_b, "B-saliente")):
        await client.post(
            "/relevos-mando",
            json={
                "activacion_id": activacion_id,
                "instancia": "coe",
                "responsable_saliente": saliente,
                "responsable_entrante": "Entrante",
                "hora_evento": ahora_iso(),
            },
            headers=auth_headers(token),
        )

    resp_filtrado = await client.get(
        "/relevos-mando", params={"activacion_id": activacion_a}, headers=auth_headers(token)
    )
    assert resp_filtrado.status_code == 200
    ids_activacion = {r["activacion_id"] for r in resp_filtrado.json()}
    assert ids_activacion == {activacion_a}

    resp_completo = await client.get("/relevos-mando", headers=auth_headers(token))
    ids_completo = {r["activacion_id"] for r in resp_completo.json()}
    assert {activacion_a, activacion_b} <= ids_completo
