import logging

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from django.db.models.signals import post_save, post_delete, pre_delete
from celery.signals import (
    task_received,
    task_postrun,
    task_prerun
)
from django.dispatch import receiver
from django.conf import settings

from papermerge.core.auth import create_access
from papermerge.core.models import (
    Access,
    Diff,
    Document,
    Folder,
    User,
)
from papermerge.core.storage import get_storage_instance

logger = logging.getLogger(__name__)


@receiver(pre_delete, sender=Document)
def delete_files(sender, instance: Document, **kwargs):
    """
    Deletes physical (e.g. pdf) file associated
    with given (Document) instance.

    More exactly it will delete whatever it is inside
    associated folder in which original file was saved
    (e.g. all preview images).
    """
    for document_version in instance.versions.all():
        try:
            get_storage_instance().delete_doc(
                document_version.document_path
            )
        except IOError as error:
            logger.error(
                f"Error deleting associated file for document.pk={instance.pk}"
                f" {error}"
            )


def node_post_save(sender, node, created, *kwargs):
    if created:
        # New node instance was created.
        # Create associated Access Model:
        # node creater has full access.
        create_access(
            node=node,
            model_type=Access.MODEL_USER,
            name=node.user.username,
            access_type=Access.ALLOW,
            access_inherited=False,
            permissions=Access.OWNER_PERMS_MAP  # full access
        )

    # Consider this two persons use case:
    # User uploader uploads scans for user margaret.
    # Initially document is in uploader's Inbox folder.
    # Afterwards, uploader moves new document X into common shared_folder.
    # shared_folder has full access permissions for
    # boths uploader and margaret.
    # When margaret sees document X, she copies it into
    # her private folder X_margaret_fld. X_margaret_fld is
    # owned only by margaret.
    # Now document X's path is margaret//X_margaret_fld/X.pdf
    # If X.pdf access permissions stay same, then uploader will
    # still have access to X.pdf (via search) which means,
    # that margaret will need to change manually X.pdf's
    # access permissions. To avoid manual change of access
    # permissions from margaret side - papermerge feature
    # is that X.pdf inherits access permissions from new
    # parent (X_margaret_fld). Thus, just by copying it,
    # X.pdf becomes margaret private doc - and uploader
    # lose its access to it.
    if node.parent:  # current node has a parent?
        # Following statement covers case when node
        # is moved from one parent to another parent.

        # When node moved from one parent to another
        # it get all its access replaced by access list of the
        # parent
        access_diff = Diff(
            operation=Diff.REPLACE,
            instances_set=node.parent.access_set.all()
        )
        node.propagate_changes(
            diffs_set=[access_diff],
            apply_to_self=True
        )
    else:
        # In case node has no parent, all its access permission
        # remain the same.
        pass


@receiver(post_save, sender=Folder)
def save_node_folder(sender, instance, created, **kwargs):
    node_post_save(sender, instance, created, kwargs)


@receiver(post_save, sender=Document)
def save_node_doc(sender, instance, created, **kwargs):
    node_post_save(sender, instance, created, kwargs)


@receiver(post_save, sender=Document)
def inherit_metadata_keys(sender, instance, created, **kwargs):
    """
    When moved into new folder, documents will inherit their parent
    metadata keys
    """
    pass
    # if doc has a parent
    # if instance.parent:
    #    instance.inherit_kv_from(instance.parent)
    #    for page in instance.pages.all():
    #        page.inherit_kv_from(instance.parent)
    # else:
    #    for page in instance.pages.all():
    #        page.inherit_kv_from(instance)


@receiver(post_save, sender=Folder)
def inherit_metadata_keys_from_parent(sender, instance, created, **kwargs):
    """
    When created or moved folders will inherit metadata keys from their
    parent.
    """
    # if folder was just created and has a parent
    if created and instance.parent:
        instance.inherit_kv_from(instance.parent)


@receiver(post_save, sender=User)
def user_init(sender, instance, created, **kwargs):
    """
    Signal sent when user model is saved
    (create=True if user was actually created).
    Create user specific data when user is initially created
    """
    if created:
        if settings.PAPERMERGE_CREATE_SPECIAL_FOLDERS:
            instance.create_special_folders()


@receiver([post_delete, post_save], sender=Document)
@receiver([post_delete, post_save], sender=Folder)
def if_inbox_then_refresh(sender, instance, **kwargs):
    """
    Inform inbox_refresh channel group that user's inbox was updated
    """
    # Folder or Document instance was deleted/moved from//to user's Inbox folder
    if instance.parent and instance.parent.title == Folder.INBOX_TITLE:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "inbox_refresh",
            {"type": "inbox.refresh", "user_id": str(instance.user.pk)}
        )


# Tasks that need to notify websocket clients
MONITORED_TASKS = (
    'papermerge.core.tasks.ocr_document_task',
    'papermerge.core.tasks.nodes_move'
)


def get_channel_data(task_name, type):

    if task_name == 'papermerge.core.tasks.ocr_document_task':
        return {
            'type': f"ocrdocumenttask.{type}"
        }
    elif task_name == 'papermerge.core.tasks.nodes_move':
        return {
            'type': f"nodesmove.{type}"
        }
    else:
        raise ValueError(f"Task name not in {MONITORED_TASKS}")


def channel_group_notify(task_name, task_kwargs, type):
    """
    Send group notification to the channel
    """
    channel_layer = get_channel_layer()
    channel_data = get_channel_data(task_name, type)

    channel_data.update(task_kwargs)
    task_short_name = task_name.split('.')[-1]

    logger.debug(
        f"channel_group_notify {task_short_name} {channel_data}"
    )
    async_to_sync(
        channel_layer.group_send
    )(
        task_short_name, channel_data
    )


@task_prerun.connect
def channel_group_notify_task_prerun(sender=None, **kwargs):
    if sender:
        if sender.name in MONITORED_TASKS:
            channel_group_notify(
                task_name=sender.name,
                task_kwargs=kwargs['kwargs'],
                type='taskstarted'
            )


@task_received.connect
def channel_group_notify_task_received(sender=None, **kwargs):
    request = kwargs.get('request')
    if request:
        if request.name in MONITORED_TASKS:
            channel_group_notify(
                task_name=request.name,
                task_kwargs=request.kwargs,
                type='taskreceived'
            )


@task_postrun.connect
def channel_group_notify_task_postrun(sender=None, **kwargs):
    if sender:
        if sender.name in MONITORED_TASKS:
            state = kwargs['state']
            if state == 'SUCCESS':
                type = 'tasksucceeded'
            else:
                type = 'taskfailed'

            channel_group_notify(
                task_name=sender.name,
                task_kwargs=kwargs['kwargs'],
                type=type
            )
