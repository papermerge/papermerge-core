import uuid
import logging

from django.utils.translation import gettext_lazy as _


logger = logging.getLogger(__name__)

OCR_STATUS_SUCCEEDED = 'succeeded'
OCR_STATUS_RECEIVED = 'received'
OCR_STATUS_STARTED = 'started'
OCR_STATUS_FAILED = 'failed'
OCR_STATUS_UNKNOWN = 'unknown'

OCR_STATUS_CHOICES = [
    ('unknown', _('Unknown')),
    ('received', _('Received')),
    ('started', _('Started')),
    ('succeeded', _('Succeeded')),
    ('failed', _('Failed')),
]


def uuid2raw_str(value: uuid.UUID) -> str:
    """Converts value into string as stored in database

    In database, UUID is stored as varchar(32) without '-' character.
    For example: UUID('1a606e93-b39c-439a-b8dd-8e981cb4d54b')
    will be converted to '1a606e93b39c439ab8dd8e981cb4d54b'.
    """
    return str(value).replace('-', '')
