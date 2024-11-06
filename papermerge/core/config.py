from enum import Enum

from pathlib import Path

from pydantic_settings import BaseSettings

class FileServer(str, Enum):
    LOCAL = 'local'
    S3 = 's3'


class Settings(BaseSettings):
    papermerge__main__logging_cfg: Path | None = Path("/etc/papermerge/logging.yaml")
    papermerge__main__media_root: Path = Path("media")
    papermerge__main__api_prefix: str = ''
    papermerge__main__file_server: FileServer = FileServer.LOCAL
    papermerge__main__cf_sign_url_private_key: str | None = None
    papermerge__main__cf_sign_url_key_id: str | None = None
    papermerge__main__cf_domain: str | None = None
    papermerge__database__url: str = "sqlite:////db/db.sqlite3"
    papermerge__redis__url: str | None = None
    papermerge__ocr__default_language: str = 'deu'
    papermerge__search__url: str | None = None


settings = Settings()

def get_settings():
    return settings
