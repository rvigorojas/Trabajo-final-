import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_password
from app.deps import get_db, get_usuario_por_username
from app.schemas.usuario import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# security-pass 2026-08-19, SEC-02: /auth/login no tenía ningún control de fuerza
# bruta. Contador en memoria por proceso, clave IP+username — limitación conocida:
# si Cloud Run corre más de una instancia, cada una cuenta por su cuenta, así que
# esto no es una garantía dura entre instancias, es una primera barrera real contra
# un atacante golpeando una sola conexión/instancia.
_INTENTOS_MAXIMOS = 5
_VENTANA_BLOQUEO_SEGUNDOS = 60
_intentos_fallidos: dict[str, list[float]] = defaultdict(list)


def _clave_intento(ip: str, username: str) -> str:
    return f"{ip}:{username}"


def _bloqueado(clave: str) -> bool:
    ahora = time.monotonic()
    vigentes = [t for t in _intentos_fallidos[clave] if ahora - t < _VENTANA_BLOQUEO_SEGUNDOS]
    _intentos_fallidos[clave] = vigentes
    return len(vigentes) >= _INTENTOS_MAXIMOS


def _registrar_fallo(clave: str) -> None:
    _intentos_fallidos[clave].append(time.monotonic())


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    ip = request.client.host if request.client else "desconocida"
    clave = _clave_intento(ip, payload.username)

    if _bloqueado(clave):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Demasiados intentos fallidos — esperá un minuto antes de reintentar",
        )

    usuario = await get_usuario_por_username(db, payload.username)
    if usuario is None or not usuario.activo or not verify_password(
        payload.password, usuario.password_hash
    ):
        _registrar_fallo(clave)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")

    token = create_access_token(usuario.id, usuario.rol.value, usuario.instancia_principal.value)
    return TokenResponse(access_token=token)
