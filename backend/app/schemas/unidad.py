from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.unidad import EstadoUnidad


class UnidadUpsert(BaseModel):
    estado: EstadoUnidad


class UnidadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    identificador: str
    estado: EstadoUnidad
    hora_recepcion: datetime
