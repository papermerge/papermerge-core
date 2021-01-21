import logging
import re

from django.db import models
from django.utils.translation import ugettext_lazy as _

from .document import Document
from .folder import Folder
from .tags import ColoredTag, UserTaggableManager
from .access import Access
from papermerge.core.signal_definitions import automates_matching


logger = logging.getLogger(__name__)

class AutomateQuerySet(models.QuerySet):

    def run(self, pages_qs):
        """
        Runs (scoped by queryset) automates
        over given page models.

        This method is invoked when user
        wants to re-run (eventually modified) selected
        automates over documents (well, pages) from its
        inbox.
        """
        total_matched = []

        for page in pages_qs:
            matched = []
            document = page.document
            page_num = page.number
            text = page.text

            for automate in self.all():
                if automate.is_a_match(text):
                    automate.apply(
                        document, page_num, text
                    )
                    matched.append(automate)
                    total_matched.append(automate)

            message = ""
            automates = Automate.objects.filter(
                pk__in=[item.pk for item in matched]
            )

            message = _(
                "%(count)s of %(total)s Automate(s) matched. ") % {
                'count': len(matched),
                'total': automates.count()
            }

            if len(matched) > 0:
                message += _(
                    "List of matched Automates: %(matched_automates)s"
                ) % {
                    'matched_automates': matched
                }

            automates_matching.send(
                sender="papermerge.core.automate",
                user_id=document.user.id,
                document_id=document.id,
                level=logging.INFO,
                message=message,
                page_num=page_num,
                text=text
            )

        return Automate.objects.filter(
            pk__in=[item.pk for item in total_matched]
        )


class AutomateManager(models.Manager):

    def get_queryset(self):
        return AutomateQuerySet(self.model, using=self._db)


class Automate(models.Model):

    """
    Automates:
        * moving of documents into destination folder
        * extraction of metadata
    """

    # any match - looks for any occurrence of any word
    # provided in the document
    MATCH_ANY = 1
    # all match - looks for all occurrences of all words
    # provided in the document (order does not matter)
    MATCH_ALL = 2
    # literal match means that the text you enter must appear in
    # the document exactly as you've entered it
    MATCH_LITERAL = 3
    # reg exp match
    MATCH_REGEX = 4

    MATCHING_ALGORITHMS = (
        (MATCH_ANY, _("Any")),
        (MATCH_ALL, _("All")),
        (MATCH_LITERAL, _("Literal")),
        (MATCH_REGEX, _("Regular Expression")),
    )

    name = models.CharField(
        _('Name'),
        max_length=128,
        unique=True
    )

    # text to match
    match = models.CharField(
        _('Match'),
        max_length=256,
        blank=True
    )

    matching_algorithm = models.PositiveIntegerField(
        _('Matching Algorithm'),
        choices=MATCHING_ALGORITHMS,
        default=MATCH_ANY,
    )

    # shoud be matching case_sensitive? i.e. uppercase == lowercase
    is_case_sensitive = models.BooleanField(
        _('Is case sensitive'),
        default=True
    )

    tags = UserTaggableManager(
        through=ColoredTag,
        blank=True  # tags are optional
    )

    dst_folder = models.ForeignKey(
        'Folder',
        on_delete=models.DO_NOTHING,
        verbose_name=_('Destination Folder'),
        blank=True,  # destination folder is optional as well
        null=True
    )

    # Should this page be cutted and pasted as separate document?
    # Very useful in case of bulk receipts scans
    extract_page = models.BooleanField(
        _('Extract Page'),
        default=False
    )

    user = models.ForeignKey(
        'User',
        models.CASCADE,
        blank=True,
        null=True
    )

    objects = AutomateManager()

    def __str__(self):
        return self.name

    def is_a_match(self, hocr):
        # Check that match is not empty
        if self.match.strip() == "":
            return False

        search_kwargs = {}
        if not self.is_case_sensitive:
            search_kwargs = {"flags": re.IGNORECASE}

        if self.matching_algorithm == Automate.MATCH_ANY:
            return self._match_any(hocr, search_kwargs)

        if self.matching_algorithm == Automate.MATCH_ALL:
            return self._match_all(hocr, search_kwargs)

        if self.matching_algorithm == Automate.MATCH_LITERAL:
            return self._match_literal(hocr, search_kwargs)

        if self.matching_algorithm == Automate.MATCH_REGEX:
            return self._match_regexp(hocr, search_kwargs)

        return False

    def move_to(self, document, dst_folder):
        document.refresh_from_db()
        dst_folder.refresh_from_db()

        if document and dst_folder:
            Document.objects.move_node(
                document, dst_folder
            )

    def is_automate_applicable(self, document):
        """
        Automation is only applicable:

        1. for documents which are in document's user inbox folder
        2. for documents  which are in one of the folders
        mentioned in automates.dst_folder.

        If 2. is ignored unexpected things might happed: consider
        this case:

            -> a. 5 page document D matches automate criteria on all pages.
            -> b. metadata will be found only on the first page
            -> c. first page is OCRed last

        Let's assume that second page is processed first and it matches
        automation criteria.
        This means that document D will be moved to destination folder.
        If only 1. is considered, all other pages of document D will not
        be applicable for automation!

        What about making all documents applicable for automation?
        In this last case, if user uploads a document to a folder M - documents
        may be moved unexpectedly by background automation process! From user
        point of view - docs will just vanish!
        """
        if not document.parent:
            return False

        if document.parent.title == Folder.INBOX_NAME:
            # document is in Inbox
            logger.debug(f"Document {document} is in Inbox")
            return True

        for automate in Automate.objects.filter(user=document.user):
            # document is in one of automation dst_folders
            if document.parent == automate.dst_folder:
                logger.debug(f"Document {document} is in one of dst folders")
                return True

        return False

    def apply(
        self,
        document,
        page_num,
        text
    ):
        logger.debug("automate.Apply begin")

        if not self.is_automate_applicable(document):
            logger.debug("Automate not applicable. Quit.")
            return

        if self.dst_folder:
            if not self.user.has_perm(Access.PERM_WRITE, self.dst_folder):
                logger.debug("User does not have write access")
                return

            self.move_to(
                document,
                self.dst_folder
            )

        _tags = [tag.name for tag in self.tags.all()]
        document.tags.add(
            *_tags,
            tag_kwargs={'user': self.user}
        )

    def _match_any(self, hocr, search_kwargs):
        for word in self._split_match():
            regexp = r"\b{}\b".format(word)
            if re.search(regexp, hocr, **search_kwargs):
                return True

        return False

    def _match_all(self, hocr, search_kwargs):

        for word in self._split_match():
            regexp = r"\b{}\b".format(word)
            search_result = re.search(
                regexp,
                hocr,
                **search_kwargs
            )
            if not search_result:
                return False

        return True

    def _match_literal(self, hocr, search_kwargs):
        """
        Simplest match - literal match  i.e.
        exact match of the given word or string.
        """
        regexp = r"\b{}\b".format(self.match)
        result = re.search(regexp, hocr, **search_kwargs)
        return bool(result)

    def _match_regexp(self, hocr, search_kwargs):
        regexp = re.compile(self.match, **search_kwargs)

        result = re.search(regexp, hocr)

        return bool(result)

    def _split_match(self):
        """
        Splits the match to individual keywords, getting rid of unnecessary
        spaces and grouping quoted words together.
        Example:
          '  some random  words "with   quotes  " and   spaces'
            ==>
          ["some", "random", "words", "with+quotes", "and", "spaces"]
        """
        findterms = re.compile(r'"([^"]+)"|(\S+)').findall
        normspace = re.compile(r"\s+").sub
        return [
            normspace(" ", (t[0] or t[1]).strip()).replace(" ", r"\s+")
            for t in findterms(self.match)
        ]
