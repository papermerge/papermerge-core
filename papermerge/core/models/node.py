import pytz
import uuid

from django.utils import timezone
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.models import ContentType

from taggit.managers import TaggableManager

from papermerge.core import validators
from papermerge.core.models.tags import ColoredTag
from polymorphic_tree.models import (
    PolymorphicMPTTModel,
    PolymorphicTreeForeignKey
)
from polymorphic_tree.managers import (
    PolymorphicMPTTModelManager,
    PolymorphicMPTTQuerySet
)

# things you can propagate from parent node to
# child node
PROPAGATE_ACCESS = 'access'
PROPAGATE_KV = 'kv'
PROPAGATE_KVCOMP = 'kvcomp'
RELATED_NAME_FMT = "%(app_label)s_%(class)s_related"
RELATED_QUERY_NAME_FMT = "%(app_label)s_%(class)ss"


class NodeManager(PolymorphicMPTTModelManager):
    pass


class NodeQuerySet(PolymorphicMPTTQuerySet):

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


class BaseTreeNode(PolymorphicMPTTModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    parent = PolymorphicTreeForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='children',
        verbose_name=_('parent')
    )
    title = models.CharField(
        _("Title"),
        max_length=200,
        validators=[validators.safe_character_validator]
    )

    lang = models.CharField(
        _('Language'),
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

    def is_folder(self):
        folder_ct = ContentType.objects.get(
            app_label='core', model='folder'
        )
        return self.polymorphic_ctype_id == folder_ct.id

    def is_document(self):
        document_ct = ContentType.objects.get(
            app_label='core', model='document'
        )
        return document_ct.id == self.polymorphic_ctype_id

    class Meta(PolymorphicMPTTModel.Meta):
        # please do not confuse this "Documents" verbose name
        # with real Document object, which is derived from BaseNodeTree.
        # The reason for this naming confusing is that from the point
        # of view of users, the BaseNodeTree are just a list of documents.
        verbose_name = _("Documents")
        verbose_name_plural = _("Documents")
        _icon_name = 'basetreenode'


class AbstractNode(models.Model):
    """
    Common class apps need to inherit from in order
    to extend BaseTreeNode model.
    """
    base_ptr = models.ForeignKey(
        BaseTreeNode,
        related_name=RELATED_NAME_FMT,
        related_query_name=RELATED_QUERY_NAME_FMT,
        on_delete=models.CASCADE
    )

    class Meta:
        abstract = True

    def get_title(self):
        return self.base_ptr.title
