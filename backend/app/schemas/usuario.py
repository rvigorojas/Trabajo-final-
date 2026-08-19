import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.usuario import InstanciaPrincipal, Rol


class UsuarioCreate(BaseModel):
    nombre: str
    username: str
    # security-pass 2026-08-19, SEC-04: sin mínimo, se aceptaba cualquier string
    # (incluida cadena vacía) como contraseña.
    password: str = Field(min_length=8)
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
