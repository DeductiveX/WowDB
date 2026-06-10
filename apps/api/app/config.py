from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_debug: bool = False
    version: str = "0.1.0"

    wowdb_db_path: str = "./wowdb.db"
    default_query_limit: int = 100
    query_timeout: int = 10

    cors_origins: str = "http://localhost:3000"
    api_key_required: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
