from pathlib import PurePath
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
    if value is None:
        raise ValueError("Non-empty value expected")

    if value == '':
        raise ValueError("Non-empty value expected")

    return str(value).replace('-', '')


def get_by_breadcrumb(klass, breadcrumb: str, user):
    """
    Returns node instance identified by breadcrumb

    This method uses SQL which is not portable: '||' is concatenates
    strings ONLY in SQLite and PostgreSQL.

    user is instance of `papermerge.core.models.User`
    klass can be either Folder or Document.

    Returns instance of either Folder or Document.
    """
    from papermerge.core.models import BaseTreeNode

    if klass.__name__ not in ('Folder', 'Document'):
        raise ValueError("klass should be either Folder or Document")

    first_part = PurePath(breadcrumb).parts[0]
    pure_breadcrumb = str(PurePath(breadcrumb))  # strips '/' at the end
    sql = '''
     WITH RECURSIVE tree AS (
         SELECT *, title as breadcrumb
         FROM core_basetreenode WHERE title = %s
         UNION ALL
         SELECT core_basetreenode.*,
            (breadcrumb || '/'  || core_basetreenode.title) as breadcrumb
         FROM core_basetreenode, tree
         WHERE core_basetreenode.parent_id = tree.id
     )
     '''
    sql += '''
    SELECT id, title FROM tree
    WHERE breadcrumb = %s and user_id = %s LIMIT 1
    '''
    user_id = uuid2raw_str(user.pk)
    result_list = list(BaseTreeNode.objects.raw(
        sql, [first_part, pure_breadcrumb, user_id]
    ))

    if len(result_list) == 0:
        raise klass.DoesNotExist()

    if len(result_list) > 1:
        raise klass.MultipleObjectsReturned()

    attr_name = klass.__name__.lower()
    # same as calling either result_list[0].folder or
    # result_list[0].document
    result = getattr(result_list[0], attr_name)

    return result
