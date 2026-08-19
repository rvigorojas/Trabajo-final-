from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

JWT_SECRET_POR_DEFECTO = "cambiar-en-produccion"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # security-pass 2026-08-19, SEC-05: distingue local/test de cualquier despliegue
    # real — Cloud Run debe fijar ENTORNO=production (ver ci.yml).
    entorno: str = "local"
    database_url: str = "postgresql+asyncpg://pce:pce@localhost:5432/pce"
    jwt_secret: str = JWT_SECRET_POR_DEFECTO
    jwt_algorithm: str = "HS256"

    @model_validator(mode="after")
    def _fail_safe_secreto_por_defecto(self) -> "Settings":
        if self.entorno not in ("local", "test") and self.jwt_secret == JWT_SECRET_POR_DEFECTO:
            raise ValueError(
                "jwt_secret sigue en su valor por defecto fuera de local/test — "
                "revisar la inyección del secreto (Secret Manager) antes de arrancar."
            )
        return self
    # ADR-7: expiración corta — el token "blando" para offline prolongado es lógica
    # de cliente (PMM), no implementada en esta fase por no existir aún ese cliente.
    jwt_expire_minutes: int = 30
    # Sin esto, cualquier fetch desde el navegador (apps/coe, apps/pmm en Vite) falla con
    # "Failed to fetch" aunque el backend responda bien por curl — CORS lo bloquea antes de
    # llegar al handler. Regex en vez de una lista fija: los dev servers de Vite eligen puerto
    # libre (5173, 5183, ...) y no está fijado en ningún documento. Incluye además los 2 sitios
    # de Firebase Hosting del despliegue real (2026-08-18): "pce-jorge-chavez" (sitio default,
    # Cliente COE) y "pce-jorge-chavez-pmm" (Cliente PMM); cada sitio expone tanto *.web.app
    # como *.firebaseapp.com.
    cors_origin_regex: str = (
        r"^https?://(localhost|127\.0\.0\.1):\d+$"
        r"|^https://pce-jorge-chavez(-pmm)?\.(web\.app|firebaseapp\.com)$"
    )


settings = Settings()
