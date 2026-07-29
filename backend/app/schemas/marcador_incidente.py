import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.marcador_incidente import CapaMapa


class MarcadorIncidenteCreate(BaseModel):
    id: uuid.UUID | None = None  # idempotencia ADR-6
    activacion_id: uuid.UUID
    coordenada_cuadricula: str
    tipo_incidente: str
    riesgo: str | None = None
    capa: CapaMapa
    hora_evento: datetime


class MarcadorIncidenteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    activacion_id: uuid.UUID
    coordenada_cuadricula: str
    tipo_incidente: str
    riesgo: str | None
    capa: CapaMapa
    estado_sincronizado: bool
    hora_evento: datetime
    hora_recepcion: datetime
