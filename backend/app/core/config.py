from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://pce:pce@localhost:5432/pce"
    jwt_secret: str = "cambiar-en-produccion"
    jwt_algorithm: str = "HS256"
    # ADR-7: expiración corta — el token "blando" para offline prolongado es lógica
    # de cliente (PMM), no implementada en esta fase por no existir aún ese cliente.
    jwt_expire_minutes: int = 30


settings = Settings()
