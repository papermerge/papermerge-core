from enum import Enum

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

class FileServer(str, Enum):
    LOCAL = 'local'
    S3 = 's3'


class Settings(BaseSettings):
    papermerge__main__logging_cfg: Path | None = Path("/etc/papermerge/logging.yaml")
    papermerge__main__media_root: Path = Path(".")
    papermerge__main__prefix: str | None = None
    papermerge__main__file_server: FileServer = FileServer.LOCAL
    papermerge__main__cf_sign_url_private_key: str | None = None
    papermerge__main__cf_sign_url_key_id: str | None = None
    papermerge__main__cf_domain: str | None = None
    papermerge__database__url: str = "sqlite:////db/db.sqlite3"
    papermerge__redis__url: str | None = None
    papermerge__ocr__default_language: str = 'deu'


@lru_cache()
def get_settings():
    return Settings()
