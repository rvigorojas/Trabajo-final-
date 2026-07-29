import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from app.db.base import engine
from app.models.usuario import Rol
from tests.conftest import ahora_iso, auth_headers, crear_usuario_y_login


async def test_no_hay_metodo_put_ni_delete_para_activaciones(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.rescate.put")
    resp_put = await client.put(
        f"/activaciones/{uuid.uuid4()}", json={}, headers=auth_headers(token)
    )
    resp_delete = await client.delete(
        f"/activaciones/{uuid.uuid4()}", headers=auth_headers(token)
    )
    assert resp_put.status_code == 405
    assert resp_delete.status_code == 405


async def test_trigger_de_db_rechaza_update_directo_sobre_activacion(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.JEFE_RESCATE, "jefe.rescate.trigger")
    creada = await client.post(
        "/activaciones",
        json={
            "tipo_emergencia": "aeronautica",
            "nivel_alerta": "I",
            "tipo_alerta": 1,
            "tipo_incidente": "Prueba",
            "hora_evento": ahora_iso(),
        },
        headers=auth_headers(token),
    )
    activacion_id = creada.json()["id"]

    with pytest.raises(DBAPIError, match="insert-only"):
        async with engine.begin() as conn:
            await conn.execute(
                text("UPDATE activacion SET tipo_incidente = 'hackeado' WHERE id = :id"),
                {"id": activacion_id},
            )
