from httpx import AsyncClient

from app.models.usuario import Rol
from tests.conftest import auth_headers, crear_usuario_y_login


async def test_put_unidad_crea_y_last_write_wins(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.SGO, "sgo.unidades")

    primero = await client.put(
        "/unidades/R1", json={"estado": "ok"}, headers=auth_headers(token)
    )
    assert primero.status_code == 200
    assert primero.json()["estado"] == "ok"

    segundo = await client.put(
        "/unidades/R1", json={"estado": "fuera_de_servicio"}, headers=auth_headers(token)
    )
    assert segundo.status_code == 200
    assert segundo.json()["estado"] == "fuera_de_servicio"
    # last-write-wins: la hora_recepcion de la segunda escritura es la que queda.
    assert segundo.json()["hora_recepcion"] >= primero.json()["hora_recepcion"]

    listado = await client.get("/unidades", headers=auth_headers(token))
    (unidad,) = [u for u in listado.json() if u["identificador"] == "R1"]
    assert unidad["estado"] == "fuera_de_servicio"
