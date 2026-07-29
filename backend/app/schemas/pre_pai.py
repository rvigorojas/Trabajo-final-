import uuid

from pydantic import BaseModel, ConfigDict

from app.models.activacion import TipoEmergencia


class PrePAIBase(BaseModel):
    nombre_escenario: str
    sector: str
    tipo_emergencia: TipoEmergencia
    caracterizacion: str
    riesgos: str | None = None
    contactos_emergencia: str | None = None
    recursos: str | None = None
    estrategias_control: str | None = None
    plano_acceso: str | None = None
    dimensiones_escenario: str | None = None


class PrePAICreate(PrePAIBase):
    pass


class PrePAIUpdate(PrePAIBase):
    pass


class PrePAIRead(PrePAIBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
