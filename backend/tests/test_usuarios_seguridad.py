from httpx import AsyncClient

from app.core.config import Settings
from app.models.usuario import InstanciaPrincipal, Rol
from tests.conftest import auth_headers, crear_usuario_y_login


def _payload_usuario(username: str, rol: Rol) -> dict:
    return {
        "nombre": f"Usuario {username}",
        "username": username,
        "password": "clave-segura",
        "rol": rol.value,
        "instancia_principal": InstanciaPrincipal.PMM.value,
    }


# SEC-01 — POST /usuarios ya no acepta requests anónimas ni roles arbitrarios sin auth.


async def test_crear_usuario_sin_token_es_rechazado(client: AsyncClient):
    # La tabla ya no está vacía: el fixture _admin_bootstrap ya insertó el admin.
    resp = await client.post("/usuarios", json=_payload_usuario("sinauth.sec01", Rol.DUTY_MANAGER))
    assert resp.status_code == 401


async def test_crear_usuario_con_rol_no_admin_es_rechazado(client: AsyncClient):
    token_m4 = await crear_usuario_y_login(client, Rol.M4, "m4.sec01")
    resp = await client.post(
        "/usuarios",
        json=_payload_usuario("nuevo.sec01", Rol.GERENTE_SEGURIDAD),
        headers=auth_headers(token_m4),
    )
    assert resp.status_code == 403


async def test_admin_si_puede_crear_usuarios(client: AsyncClient):
    token_admin = await crear_usuario_y_login(client, Rol.ADMIN, "admin.sec01")
    resp = await client.post(
        "/usuarios",
        json=_payload_usuario("nuevo2.sec01", Rol.GERENTE_SEGURIDAD),
        headers=auth_headers(token_admin),
    )
    assert resp.status_code == 201, resp.text


# SEC-06 — GET /usuarios restringido a roles de gestión.


async def test_get_usuarios_rechaza_rol_operativo(client: AsyncClient):
    token_m4 = await crear_usuario_y_login(client, Rol.M4, "m4.sec06")
    resp = await client.get("/usuarios", headers=auth_headers(token_m4))
    assert resp.status_code == 403


async def test_get_usuarios_permite_rol_de_gestion(client: AsyncClient):
    token_duty = await crear_usuario_y_login(client, Rol.DUTY_MANAGER, "duty.sec06")
    resp = await client.get("/usuarios", headers=auth_headers(token_duty))
    assert resp.status_code == 200


# SEC-04 — contraseña con longitud mínima.


async def test_password_corta_es_rechazada(client: AsyncClient):
    token_admin = await crear_usuario_y_login(client, Rol.ADMIN, "admin.sec04")
    payload = _payload_usuario("corta.sec04", Rol.M4)
    payload["password"] = "1234567"  # 7 caracteres, por debajo del mínimo
    resp = await client.post("/usuarios", json=payload, headers=auth_headers(token_admin))
    assert resp.status_code == 422


# SEC-02 — rate limiting en /auth/login tras intentos fallidos consecutivos.


async def test_login_bloquea_tras_intentos_fallidos_consecutivos(client: AsyncClient):
    await crear_usuario_y_login(client, Rol.M4, "m4.sec02")

    ultima = None
    for _ in range(5):
        ultima = await client.post(
            "/auth/login", json={"username": "m4.sec02", "password": "incorrecta"}
        )
        assert ultima.status_code == 401

    bloqueada = await client.post(
        "/auth/login", json={"username": "m4.sec02", "password": "incorrecta"}
    )
    assert bloqueada.status_code == 429

    # Con la contraseña correcta también queda bloqueado mientras dure la ventana —
    # el límite es por intentos previos, no valida la contraseña actual primero.
    con_clave_correcta = await client.post(
        "/auth/login", json={"username": "m4.sec02", "password": "clave-segura"}
    )
    assert con_clave_correcta.status_code == 429


# SEC-05 — fail-safe del secreto JWT por defecto fuera de local/test.


def test_settings_falla_con_secreto_por_defecto_fuera_de_local():
    try:
        Settings(entorno="production", jwt_secret="cambiar-en-produccion")
    except Exception:
        pass
    else:
        raise AssertionError("Settings no debería aceptar el secreto por defecto en production")


def test_settings_acepta_secreto_por_defecto_en_local():
    Settings(entorno="local", jwt_secret="cambiar-en-produccion")


def test_settings_acepta_secreto_custom_en_production():
    Settings(entorno="production", jwt_secret="un-secreto-real-largo")
