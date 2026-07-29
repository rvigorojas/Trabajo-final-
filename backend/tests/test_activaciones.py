import uuid

from httpx import AsyncClient

from app.models.usuario import Rol
from tests.conftest import ahora_iso, auth_headers, crear_usuario_y_login


async def test_activacion_aeronautica_alerta_iii_auto_convoca_jefe_de_rescate(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.rescate")

    resp = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "aeronautica",
            "nivel_alerta": "III",
            "tipo_alerta": 7,
            "tipo_incidente": "Aterrizaje de emergencia",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["nivel_alerta"] == "III"
    roles_convocados = {m["rol"] for m in data["convocatoria"]}
    assert Rol.JEFE_RESCATE.value in roles_convocados


async def test_activacion_epidemiologica_deriva_nivel_alerta_desde_triaje(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.DUTY_MANAGER, "duty.manager")

    resp = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "epidemiologica",
            "clasificacion_origen": "URGENCIA",
            "tipo_incidente": "Pasajero con dolor torácico",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["nivel_alerta"] == "II"  # URGENCIA -> activación parcial


async def test_matpel_siempre_deriva_alerta_general(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.DUTY_MANAGER, "duty.manager2")

    resp = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "matpel",
            "clasificacion_origen": "Clase 3",
            "tipo_incidente": "Derrame de líquido inflamable",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["nivel_alerta"] == "III"


async def test_reintentar_post_con_mismo_id_es_idempotente(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.rescate2")
    activacion_id = str(uuid.uuid4())
    payload = {
        "id": activacion_id,
        "tipo_emergencia": "aeronautica",
        "nivel_alerta": "III",
        "tipo_alerta": 3,
        "tipo_incidente": "Incendio en pista",
        "hora_evento": ahora_iso(),
    }

    primera = await client.post("/activaciones", json=payload, headers=auth_headers(token))
    segunda = await client.post("/activaciones", json=payload, headers=auth_headers(token))

    assert primera.status_code == 201
    assert segunda.status_code == 201
    assert primera.json()["id"] == segunda.json()["id"]
    # No debe duplicar la convocatoria auto-generada en el reintento
    assert len(primera.json()["convocatoria"]) == len(segunda.json()["convocatoria"])

    listado = await client.get("/activaciones", headers=auth_headers(token))
    ids = [a["id"] for a in listado.json()]
    assert ids.count(activacion_id) == 1
