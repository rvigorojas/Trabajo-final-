import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.activacion import EstadoActivacion, NivelAlerta, TipoEmergencia
from app.schemas.convocatoria_miembro import ConvocatoriaMiembroRead


class ActivacionCreate(BaseModel):
    id: uuid.UUID | None = None  # cliente PMM lo genera para idempotencia (ADR-6); si no viene, lo genera el servicio
    tipo_emergencia: TipoEmergencia
    # Aeronáutica: nivel_alerta se recibe directo (el PRD no confirma una derivación desde
    # tipo_alerta). Las otras 3 categorías: se deriva server-side de clasificacion_origen
    # (services/clasificacion.py) — no se acepta nivel_alerta suelto para evitar que quede
    # desalineado de su campo de clasificación de origen.
    nivel_alerta: NivelAlerta | None = None  # solo Aeronáutica
    clasificacion_origen: str | None = None  # solo no-Aeronáutica
    tipo_alerta: int | None = None  # solo aeronáutica (1-10), en paralelo a nivel_alerta
    tipo_incidente: str
    hora_evento: datetime

    @model_validator(mode="after")
    def _validar_por_categoria(self) -> "ActivacionCreate":
        if self.tipo_emergencia == TipoEmergencia.AERONAUTICA:
            if self.tipo_alerta is None or not (1 <= self.tipo_alerta <= 10):
                raise ValueError("tipo_alerta (1-10) es obligatorio para Aeronáutica")
            if self.nivel_alerta is None:
                raise ValueError("nivel_alerta es obligatorio para Aeronáutica")
            if self.clasificacion_origen is not None:
                raise ValueError("clasificacion_origen no aplica a Aeronáutica")
        else:
            if self.tipo_alerta is not None:
                raise ValueError("tipo_alerta solo aplica a Aeronáutica")
            if self.nivel_alerta is not None:
                raise ValueError("nivel_alerta se deriva de clasificacion_origen, no se recibe directo")
            if not self.clasificacion_origen:
                raise ValueError("clasificacion_origen es obligatorio fuera de Aeronáutica")
        return self


class ActivacionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tipo_emergencia: TipoEmergencia
    nivel_alerta: NivelAlerta
    clasificacion_origen: str | None
    tipo_alerta: int | None
    tipo_incidente: str
    estado: EstadoActivacion
    hora_evento: datetime
    hora_recepcion: datetime


class ActivacionConConvocatoria(ActivacionRead):
    convocatoria: list[ConvocatoriaMiembroRead] = []
