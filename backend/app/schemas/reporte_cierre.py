import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.activacion import TipoEmergencia


class ReporteCierreCreate(BaseModel):
    activacion_id: uuid.UUID


class ReporteCierreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    activacion_id: uuid.UUID
    tipo_emergencia: TipoEmergencia
    generado_en: datetime
    datos: dict
