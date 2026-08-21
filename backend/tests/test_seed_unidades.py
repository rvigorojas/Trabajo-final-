from httpx import AsyncClient

from app.db.base import SessionLocal
from app.models.usuario import Rol
from app.services.seed import seed_unidades
from tests.conftest import auth_headers, crear_usuario_y_login

_IDENTIFICADORES_FLOTA_FIJA = {"R1", "R2", "R8", "R9", "R10", "R11", "R12", "R13", "CR9"}


async def test_seed_unidades_crea_la_flota_fija_si_esta_vacia(client: AsyncClient):
    async with SessionLocal() as db:
        await seed_unidades(db)

    token = await crear_usuario_y_login(client, Rol.SGO, "sgo.seed.unidades")
    listado = (await client.get("/unidades", headers=auth_headers(token))).json()

    assert {u["identificador"] for u in listado} == _IDENTIFICADORES_FLOTA_FIJA
    assert all(u["estado"] == "ok" for u in listado)


async def test_seed_unidades_no_pisa_estados_ya_registrados(client: AsyncClient):
    token = await crear_usuario_y_login(client, Rol.SGO, "sgo.seed.unidades.idempotente")
    await client.put(
        "/unidades/R1", json={"estado": "fuera_de_servicio"}, headers=auth_headers(token)
    )

    async with SessionLocal() as db:
        await seed_unidades(db)  # ya hay una fila -> no debe sembrar ni pisar nada

    listado = (await client.get("/unidades", headers=auth_headers(token))).json()
    (r1,) = [u for u in listado if u["identificador"] == "R1"]
    assert r1["estado"] == "fuera_de_servicio"
    assert len(listado) == 1
