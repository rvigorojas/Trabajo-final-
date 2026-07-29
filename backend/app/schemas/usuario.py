import uuid

from pydantic import BaseModel, ConfigDict

from app.models.usuario import InstanciaPrincipal, Rol


class UsuarioCreate(BaseModel):
    nombre: str
    username: str
    password: str
    rol: Rol
    instancia_principal: InstanciaPrincipal
    contacto: str | None = None


class UsuarioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    username: str
    rol: Rol
    instancia_principal: InstanciaPrincipal
    contacto: str | None
    activo: bool


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
