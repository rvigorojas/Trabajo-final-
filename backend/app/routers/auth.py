from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_password
from app.deps import get_db, get_usuario_por_username
from app.schemas.usuario import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    usuario = await get_usuario_por_username(db, payload.username)
    if usuario is None or not usuario.activo or not verify_password(
        payload.password, usuario.password_hash
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales inválidas")

    token = create_access_token(usuario.id, usuario.rol.value, usuario.instancia_principal.value)
    return TokenResponse(access_token=token)
