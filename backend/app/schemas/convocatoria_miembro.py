import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.usuario import Rol


class ConvocatoriaMiembroRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    activacion_id: uuid.UUID
    usuario_id: uuid.UUID
    rol: Rol
    hora_confirmacion: datetime | None
