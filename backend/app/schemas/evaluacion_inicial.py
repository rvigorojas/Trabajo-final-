import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EvaluacionInicialCreate(BaseModel):
    id: uuid.UUID | None = None  # idempotencia ADR-6
    activacion_id: uuid.UUID
    magnitud: str
    riesgos_secundarios: str | None = None
    hora_evento: datetime


class EvaluacionInicialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    activacion_id: uuid.UUID
    magnitud: str
    riesgos_secundarios: str | None
    hora_evento: datetime
    hora_recepcion: datetime
