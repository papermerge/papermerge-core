from enum import Enum
from pathlib import Path

from pydantic import PostgresDsn, RedisDsn, Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

from papermerge.core.types import DocumentLang


class FileServer(str, Enum):
    LOCAL = 'local'
    S3 = 's3'


class Settings(BaseSettings):
    db_url: PostgresDsn
    log_config: Path | None = Path("/app/log_config.yaml")
    api_prefix: str = ''  # e.g. '/api', '/api/v1/'
    default_lang: DocumentLang = DocumentLang.deu

    # Redis
    cache_enabled: bool = False
    redis_url: RedisDsn | None = None

    # File storage
    media_root: Path = Path("media")
    max_file_size_mb: int = Field(gt=0, default=25)  # in MB
    file_server: FileServer = FileServer.LOCAL
    cf_sign_url_private_key: str | None = None
    cf_sign_url_key_id: str | None = None
    cf_domain: str | None = None

    preview_page_size_sm: int = Field(gt=0, default=200)  # pixels

    # Multitenant prefix
    prefix: str = '' # usage to prefix file path on S3 storage

    @computed_field
    @property
    def async_db_url(self) -> str:
        return str(self.db_url).replace("postgresql://", "postgresql+asyncpg://", 1)

    model_config = SettingsConfigDict(env_prefix='pm_')


settings = Settings()

def get_settings():
    return settings
