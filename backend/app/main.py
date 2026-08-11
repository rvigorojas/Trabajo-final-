from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.audit import registrar_listeners_auditoria
from app.db.base import SessionLocal
from app.routers import (
    activaciones,
    auth,
    evaluaciones_iniciales,
    marcadores_incidente,
    pre_pai,
    relevos_mando,
    reportes_cierre,
    unidades,
    usuarios,
)
from app.services.seed import seed_rol_convocatoria


@asynccontextmanager
async def lifespan(app: FastAPI):
    registrar_listeners_auditoria()
    async with SessionLocal() as db:
        await seed_rol_convocatoria(db)
    yield


app = FastAPI(
    title="PCE — Puesto de Comando y Administración de Emergencias",
    description="Backend (API + módulo de sincronización) — SSEI, Aeropuerto Jorge Chávez",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(activaciones.router)
app.include_router(evaluaciones_iniciales.router)
app.include_router(relevos_mando.router)
app.include_router(unidades.router)
app.include_router(marcadores_incidente.router)
app.include_router(pre_pai.router)
app.include_router(reportes_cierre.router)


@app.get("/salud", tags=["salud"])
async def salud() -> dict:
    return {"estado": "ok"}
