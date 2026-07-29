from datetime import datetime, timezone

import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.db.audit import registrar_listeners_auditoria
from app.db.base import SessionLocal, engine
from app.main import app
from app.models.usuario import InstanciaPrincipal, Rol
from app.services.seed import seed_rol_convocatoria

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


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def crear_usuario_y_login(client: AsyncClient, rol: Rol, username: str) -> str:
    await client.post(
        "/usuarios",
        json={
            "nombre": f"Usuario {username}",
            "username": username,
            "password": "clave-segura",
            "rol": rol.value,
            "instancia_principal": InstanciaPrincipal.PMM.value,
        },
    )
    resp = await client.post("/auth/login", json={"username": username, "password": "clave-segura"})
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def ahora_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
