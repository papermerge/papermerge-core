import logging

from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from papermerge.core.models import (
    Document,
    Folder
)

logger = logging.getLogger(__name__)


@receiver([post_delete, post_save], sender=Document)
@receiver([post_delete, post_save], sender=Folder)
def if_inbox_then_refresh(sender, instance, **kwargs):
    """
    Inform inbox_refresh channel group that user's inbox was updated
    """
    # Folder or Document instance was deleted/moved from//to user's Inbox folder
    try:
        instance.refresh_from_db()
    except (Document.DoesNotExist, Folder.DoesNotExist):
        logger.warning('Too late - Document/Folder was already deleted')
        return

    try:
        if instance.parent and instance.parent.title == Folder.INBOX_TITLE:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "inbox_refresh",
                {"type": "inbox.refresh", "user_id": str(instance.user.pk)}
            )
    except Exception as ex:
        logger.warning(ex, exc_info=True)
