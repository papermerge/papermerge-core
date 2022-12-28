import pytz
import uuid

from django.utils import timezone
from django.db import models

from taggit.managers import TaggableManager

from papermerge.core import validators
from papermerge.core.models.tags import ColoredTag


NODE_TYPE_FOLDER = 'folder'
NODE_TYPE_DOCUMENT = 'document'


class NodeManager(models.Manager):
    pass


class NodeQuerySet(models.QuerySet):

    def delete(self, *args, **kwargs):
        for node in self:
            descendants = node.get_descendants()

            if descendants.count() > 0:
                descendants.delete(*args, **kwargs)
            # At this point all descendants were deleted.
            # Self delete :)
            try:
                node.delete(*args, **kwargs)
            except BaseTreeNode.DoesNotExist:
                # this node was deleted by earlier recursive call
                # it is ok, just skip
                pass


CustomNodeManager = NodeManager.from_queryset(NodeQuerySet)


class BaseTreeNode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='children',
        verbose_name='parent'
    )
    title = models.CharField(
        "Title",
        max_length=200,
        validators=[validators.safe_character_validator]
    )

    lang = models.CharField(
        'Language',
        max_length=8,
        blank=False,
        null=False,
        default='deu'
    )

    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    tags = TaggableManager(through=ColoredTag)

    # custom Manager + custom QuerySet
    objects = CustomNodeManager()

    @property
    def idified_title(self):
        """
        Returns a title with ID part inserted at the end

        Example:
            input: title="My Invoices", id="233453"
            output: "My Invoices-233453"
        """

        return f'{self.title}-{self.id}'

    def human_datetime(self, _datetime) -> str:
        """
        Localize and format datetime instance considering user preferences.
        """
        tz = pytz.timezone(
            self.user.preferences['localization__timezone']
        )
        fmt = self.user.preferences['localization__date_format']
        fmt += " " + self.user.preferences['localization__time_format']

        ret_datetime = timezone.localtime(_datetime, timezone=tz)

        ret = ret_datetime.strftime(fmt)
        return ret

    @property
    def human_updated_at(self) -> str:
        """
        updated_at displayed considering user's timezone, date and time prefs.

        returns string with user friendly formated datetime.
        """

        ret = self.human_datetime(self.updated_at)
        return ret

    @property
    def human_created_at(self) -> str:
        """
        created_at displayed considering user's timezone, date and time prefs.
        """
        ret = self.human_datetime(self.created_at)
        return ret

    @property
    def type(self):
        try:
            self.folder
        except Exception:
            return NODE_TYPE_DOCUMENT

        return NODE_TYPE_FOLDER

    def is_folder(self):
        return self.type == NODE_TYPE_FOLDER

    def is_document(self):
        return self.type == NODE_TYPE_DOCUMENT

    class Meta:
        # please do not confuse this "Documents" verbose name
        # with real Document object, which is derived from BaseNodeTree.
        # The reason for this naming confusing is that from the point
        # of view of users, the BaseNodeTree are just a list of documents.
        verbose_name = "Documents"
        verbose_name_plural = "Documents"
        _icon_name = 'basetreenode'

        constraints = [
            models.UniqueConstraint(
                fields=['parent', 'title'], name='unique title per parent'
            ),
        ]
