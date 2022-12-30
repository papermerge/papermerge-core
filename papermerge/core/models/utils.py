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
