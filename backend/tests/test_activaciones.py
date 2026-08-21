import uuid

from httpx import AsyncClient

from app.models.usuario import Rol
from tests.conftest import ahora_iso, auth_headers, crear_usuario_y_login


async def test_activacion_aeronautica_alerta_iii_auto_convoca_matriz_real(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.rescate")
    # Solo se convoca a usuarios que ya existen con ese rol (auto_convocar
    # cruza RolConvocatoria contra Usuario.rol) — se crean acá para poder
    # observar la matriz real, sin usar sus tokens.
    await crear_usuario_y_login(client, Rol.SUPERVISOR_GRAL_RESCATE, "sup.gral.rescate")
    await crear_usuario_y_login(client, Rol.GERENTE_LOGISTICA, "gerente.logistica")

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
    # Matriz real GSEG-L-001 § 4.2.2: Supervisor Gral. de Rescate está en Alerta
    # II y III; Gerente de Logística solo se suma en la Activación General
    # (Alerta III) — confirma que la escalación de matriz funciona, no solo que
    # hay convocatoria.
    assert Rol.SUPERVISOR_GRAL_RESCATE.value in roles_convocados
    assert Rol.GERENTE_LOGISTICA.value in roles_convocados
    # El Jefe de Rescate es el Comandante de Incidente que activa, no un
    # "convocado" adicional del plan.
    assert Rol.JEFE_RESCATE.value not in roles_convocados


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


async def test_no_permite_dos_activaciones_activas_a_la_vez(client: AsyncClient):
    """Walkthrough real 2026-08-19: sin esta restricción, la 2da activación
    "gana" la UI y la 1ra queda ACTIVA en la base para siempre, sin ningún
    botón que la alcance (migración 0005, uq_activacion_unica_activa)."""
    token = await crear_usuario_y_login(client, Rol.DUTY_MANAGER, "duty.manager3")

    primera = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "aeronautica",
            "nivel_alerta": "I",
            "tipo_alerta": 1,
            "tipo_incidente": "Primera activación",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    assert primera.status_code == 201, primera.text

    segunda = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "aeronautica",
            "nivel_alerta": "I",
            "tipo_alerta": 2,
            "tipo_incidente": "Segunda activación",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    assert segunda.status_code == 409, segunda.text

    # Tras desactivar la primera, sí se puede crear una nueva.
    await client.post(
        f"/activaciones/{primera.json()['id']}/desactivar",
        headers=auth_headers(token),
    )
    tercera = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "aeronautica",
            "nivel_alerta": "I",
            "tipo_alerta": 3,
            "tipo_incidente": "Tercera activación",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    assert tercera.status_code == 201, tercera.text
