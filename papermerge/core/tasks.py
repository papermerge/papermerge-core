import logging

from celery import shared_task

from papermerge.core.models import User

logger = logging.getLogger(__name__)


@shared_task
def delete_user_data(user_id):
    try:
        user = User.objects.get(id=user_id)
        # first delete all files associated with the user
        user.delete_user_data()
        # then delete the user DB entry
        user.delete()
    except User.DoesNotExist:
        logger.info(f"User: {user_id} already deleted")
