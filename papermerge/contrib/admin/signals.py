import logging

from django.dispatch import receiver
from django.utils.translation import gettext as _

from papermerge.core.models import Folder

from papermerge.core.signal_definitions import (
    folder_created,
    nodes_deleted,
)
from papermerge.contrib.admin.models import LogEntry

logger = logging.getLogger(__name__)


@receiver(folder_created)
def folder_created_handler(sender, **kwargs):
    folder_id = kwargs.get('folder_id')
    user_id = kwargs.get('user_id')
    level = kwargs.get('level')

    folder = Folder.objects.get(id=folder_id)

    folder_title = folder.title

    msg = _(
        "Node/Folder %(folder_title)s created. Folder id=%(folder_id)s."
    ) % {
        'folder_title': folder_title,
        'folder_id': folder_id
    }

    LogEntry.objects.create(
        user_id=user_id,
        level=level,
        message=msg
    )


@receiver(nodes_deleted)
def nodes_deleted_handler(sender, **kwargs):
    node_titles = kwargs.get('node_titles')
    user_id = kwargs.get('user_id')
    level = kwargs.get('level')
    node_ids = kwargs.get('node_ids')
    msg = _(
        "Node(s) %(node_titles)s were deleted. Node ids=%(node_ids)s"
    ) % {
        'node_titles': ', '.join(node_titles),
        'node_ids': node_ids
    }

    LogEntry.objects.create(
        user_id=user_id,
        level=level,
        message=msg
    )
