import logging
import uuid
from pathlib import PurePath

from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)

OCR_STATUS_SUCCEEDED = "SUCCESS"
OCR_STATUS_RECEIVED = "RECEIVED"
OCR_STATUS_STARTED = "STARTED"
OCR_STATUS_FAILED = "FAILED"
OCR_STATUS_UNKNOWN = "UNKNOWN"

OCR_STATUS_CHOICES = [
    ("unknown", _("Unknown")),
    ("received", _("Received")),
    ("started", _("Started")),
    ("succeeded", _("Succeeded")),
    ("failed", _("Failed")),
]


def uuid2raw_str(value: uuid.UUID) -> str:
    """Converts value into string as stored in database

    In database, UUID is stored as varchar(32) without '-' character.
    For example: UUID('1a606e93-b39c-439a-b8dd-8e981cb4d54b')
    will be converted to '1a606e93b39c439ab8dd8e981cb4d54b'.
    """
    if value is None:
        raise ValueError("Non-empty value expected")

    if value == "":
        raise ValueError("Non-empty value expected")

    return str(value).replace("-", "")


def get_by_breadcrumb(klass, breadcrumb: str, user):
    """
    Returns node instance identified by breadcrumb

    This method uses SQL which is not portable: '||' is concatenates
    strings ONLY in SQLite and PostgreSQL.

    user is instance of the `papermerge.core.models.User`
    class can be either Folder or Document.

    Returns instance of either Folder or Document.
    """
    from papermerge.core.models import BaseTreeNode

    if klass.__name__ not in ("Folder", "Document"):
        raise ValueError("klass should be either Folder or Document")

    first_part = PurePath(breadcrumb).parts[0]
    pure_breadcrumb = str(PurePath(breadcrumb))  # strips '/' at the end
    sql = """
     WITH RECURSIVE tree AS (
         SELECT id,
            user_id,
            title,
            CAST(title AS character varying) as breadcrumb
         FROM nodes WHERE title = %s
         UNION ALL
         SELECT nodes.id,
            nodes.user_id,
            nodes.title,
            (breadcrumb || '/'  || nodes.title) as breadcrumb
         FROM nodes, tree
         WHERE nodes.parent_id = tree.id
     )
     """
    sql += """
    SELECT id, title FROM tree
    WHERE breadcrumb = %s and user_id = %s LIMIT 1
    """
    user_id = uuid2raw_str(user.pk)
    result_list = list(
        BaseTreeNode.objects.raw(sql, [first_part, pure_breadcrumb, user_id])
    )

    if len(result_list) == 0:
        raise klass.DoesNotExist()

    if len(result_list) > 1:
        raise klass.MultipleObjectsReturned()

    attr_name = klass.__name__.lower()
    # same as calling either result_list[0].folder or
    # result_list[0].document
    result = getattr(result_list[0], attr_name)

    return result
