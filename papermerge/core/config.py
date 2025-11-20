from enum import Enum
from pathlib import Path

from pydantic_settings import BaseSettings


class FileServer(str, Enum):
    LOCAL = 'local'
    S3 = 's3'

class Settings(BaseSettings):
    papermerge__database__url: str
    # default value for document's "lang" attribute (if nothing else
    # is provided)
    papermerge__main__default_document_lang: str = 'deu'
    # default value for document full text search language (if nothing else
    # is provided)
    papermerge__main__default_search_lang: str = 'deu'
    papermerge__main__max_file_size_mb: int = 25  # in MB
    papermerge__main__logging_cfg: Path | None = Path("/etc/papermerge/logging.yaml")
    papermerge__main__media_root: Path = Path("media")
    papermerge__main__api_prefix: str = ''
    papermerge__main__prefix: str = ''
    papermerge__main__file_server: FileServer = FileServer.LOCAL
    papermerge__main__cf_sign_url_private_key: str | None = None
    papermerge__main__cf_sign_url_key_id: str | None = None
    papermerge__main__cf_domain: str | None = None
    papermerge__main__cache_enabled: bool = False
    papermerge__redis__url: str | None = None

    papermerge__ocr__default_lang_code: str = 'deu'
    papermerge__preview__page_size_sm: int = 200  # pixels
    # When is OCR triggered ?
    # `ocr__automatic` = True means that OCR will be performed without
    #   end user intervention i.e. via background scheduler like celery scheduler
    # `ocr__automatic` = False means that OCR will be performed only
    #   if requested by end user. In this case user can choose to
    #   start schedule OCR on upload; also in this case use can choose to
    #   scheduler OCR later on any document.
    papermerge__ocr__automatic: bool = False

settings = Settings()

def get_settings():
    return settings
