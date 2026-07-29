import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.relevo_mando import Instancia


class RelevoMandoCreate(BaseModel):
    id: uuid.UUID | None = None  # idempotencia ADR-6
    instancia: Instancia
    responsable_saliente: str
    responsable_entrante: str
    hora_evento: datetime


class RelevoMandoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    instancia: Instancia
    responsable_saliente: str
    responsable_entrante: str
    hora_evento: datetime
    hora_recepcion: datetime
