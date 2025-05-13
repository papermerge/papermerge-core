from uuid import UUID

from papermerge.core import pathlib as plib
from papermerge.core import config

settings = config.get_settings()

VALID_FOR_SECONDS = 600


def doc_thumbnail_signed_url(uid: UUID) -> str:
    from papermerge.core.cloudfront import sign_url

    resource_path = plib.thumbnail_path(uid)
    prefix = settings.papermerge__main__prefix
    if prefix:
        url = f"https://{settings.papermerge__main__cf_domain}/{prefix}/{resource_path}"
    else:
        url = f"https://{settings.papermerge__main__cf_domain}/{resource_path}"

    return sign_url(
        url,
        valid_for=VALID_FOR_SECONDS,
    )
