from pathlib import Path

from pydantic import PostgresDsn, RedisDsn, Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

from papermerge.core.types import DocumentLang, StorageBackend


class Settings(BaseSettings):
    db_url: PostgresDsn
    # Connect to DB via SSL
    db_ssl: bool = False
    log_config: Path | None = Path("/app/log_config.yaml")
    api_prefix: str = ''
    default_lang: DocumentLang = DocumentLang.deu

    # Redis
    cache_enabled: bool = False
    redis_url: RedisDsn | None = None

    # File storage
    media_root: Path = Path("media")
    max_file_size_mb: int = Field(gt=0, default=25)
    storage_backend: StorageBackend = StorageBackend.LOCAL

    # AWS CloudFront settings
    cf_sign_url_private_key: str | None = None
    cf_sign_url_key_id: str | None = None
    cf_domain: str | None = None

    # Cloudflare R2 settings
    r2_account_id: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    bucket_name: str | None = None

    preview_page_size_sm: int = Field(gt=0, default=200)

    # Multitenant prefix
    prefix: str = ''

    # Remote user config
    remote_user_header: str = "X-Forwarded-User"
    remote_groups_header: str = "X-Forwarded-Groups"
    remote_roles_header: str = "X-Forwarded-Roles"
    remote_name_header: str = "X-Forwarded-Name"
    remote_email_header: str = "X-Forwarded-Email"

    @computed_field
    @property
    def async_db_url(self) -> str:
        return str(self.db_url).replace("postgresql://", "postgresql+asyncpg://", 1)

    @computed_field
    @property
    def r2_endpoint_url(self) -> str | None:
        if self.r2_account_id:
            return f"https://{self.r2_account_id}.r2.cloudflarestorage.com"
        return None

    model_config = SettingsConfigDict(env_prefix='pm_')


settings = Settings()

def get_settings():
    return settings
