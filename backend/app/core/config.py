from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://pce:pce@localhost:5432/pce"
    jwt_secret: str = "cambiar-en-produccion"
    jwt_algorithm: str = "HS256"
    # ADR-7: expiración corta — el token "blando" para offline prolongado es lógica
    # de cliente (PMM), no implementada en esta fase por no existir aún ese cliente.
    jwt_expire_minutes: int = 30
    # Sin esto, cualquier fetch desde el navegador (apps/coe, apps/pmm en Vite) falla con
    # "Failed to fetch" aunque el backend responda bien por curl — CORS lo bloquea antes de
    # llegar al handler. Regex en vez de una lista fija: los dev servers de Vite eligen puerto
    # libre (5173, 5183, ...) y no está fijado en ningún documento. Solo local — ajustar antes
    # de cualquier despliegue real (ADR-8).
    cors_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1):\d+$"


settings = Settings()
