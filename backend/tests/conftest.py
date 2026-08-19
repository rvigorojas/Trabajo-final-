from datetime import datetime, timezone

import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.core.security import hash_password
from app.db.audit import registrar_listeners_auditoria
from app.db.base import SessionLocal, engine
from app.main import app
from app.models.usuario import InstanciaPrincipal, Rol, Usuario
from app.services.seed import seed_rol_convocatoria

# security-pass 2026-08-19, SEC-01: POST /usuarios ahora exige rol admin salvo que la
# tabla esté vacía (bootstrap del primer admin). Este fixture crea ese admin directo
# en la DB (no vía API) en cada test, para que crear_usuario_y_login pueda seguir
# creando usuarios de cualquier rol autenticándose como este admin — sin tener que
# tocar sus 47 usos en el resto de la suite.
_ADMIN_BOOTSTRAP_USERNAME = "_admin_bootstrap_test"
_ADMIN_BOOTSTRAP_PASSWORD = "clave-admin-bootstrap"

_TABLAS_POR_TEST = (
    "usuario",
    "activacion",
    "convocatoria_miembro",
    "evaluacion_inicial",
    "relevo_mando",
    "unidad",
    "marcador_incidente",
    "pre_pai",
    "reporte_cierre",
    "log_auditoria",
)


@pytest.fixture(scope="session")
def _schema():
    """alembic upgrade head / downgrade base contra el Postgres de docker-compose
    (backend/.env o DATABASE_URL debe apuntar ahí — ver README de verificación)."""
    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")
    yield
    command.downgrade(cfg, "base")


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _preparar_sesion(_schema):
    registrar_listeners_auditoria()
    async with SessionLocal() as db:
        await seed_rol_convocatoria(db)
    yield


@pytest_asyncio.fixture(autouse=True)
async def _limpiar_tablas():
    async with engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {', '.join(_TABLAS_POR_TEST)} RESTART IDENTITY CASCADE"))
    yield


@pytest_asyncio.fixture(autouse=True)
async def _admin_bootstrap(_limpiar_tablas):
    async with SessionLocal() as db:
        db.add(
            Usuario(
                nombre="Admin bootstrap (tests)",
                username=_ADMIN_BOOTSTRAP_USERNAME,
                password_hash=hash_password(_ADMIN_BOOTSTRAP_PASSWORD),
                rol=Rol.ADMIN,
                instancia_principal=InstanciaPrincipal.COE,
            )
        )
        await db.commit()
    yield


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def crear_usuario_y_login(client: AsyncClient, rol: Rol, username: str) -> str:
    admin_login = await client.post(
        "/auth/login",
        json={"username": _ADMIN_BOOTSTRAP_USERNAME, "password": _ADMIN_BOOTSTRAP_PASSWORD},
    )
    admin_token = admin_login.json()["access_token"]
    await client.post(
        "/usuarios",
        json={
            "nombre": f"Usuario {username}",
            "username": username,
            "password": "clave-segura",
            "rol": rol.value,
            "instancia_principal": InstanciaPrincipal.PMM.value,
        },
        headers=auth_headers(admin_token),
    )
    resp = await client.post("/auth/login", json={"username": username, "password": "clave-segura"})
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def ahora_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
