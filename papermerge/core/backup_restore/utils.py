from enum import Enum
from pathlib import PurePath

from papermerge.core import models


class CType(Enum):
    """Node Type"""
    FOLDER = 'folder'
    DOCUMENT = 'document'


def breadcrumb_parts_count(item: dict[str, str]) -> int:
    """
    Returns parts count of the breadcrumb.

    Item is a dictionary with at least one key 'breadcrumb'.
    Example of items:
        item = {"breadcrumb": "A/"}  - one parts breadcrumb
        item = {"breadcrumb": "A/B/"}  - two parts breadcrumb
        item = {"breadcrumb": "A/B/C/"}  - three parts breadcrumb
        item = {"breadcrumb": "A/doc.pdf"}  - two parts breadcrumb

    Note that breadcrumb path to a folder always ends with '/' character.
    """
    return len(PurePath(item['breadcrumb']).parts)


class RestoreSequence:
    """
    Sequence which iterates over nodes in 'correct' order.

    The whole point of RestoreSequence is to iterate over nodes
    in such order that guarantees that parent node is yielded
    BEFORE child node.
    Even though nodes are stored in a list, they are hierarchical.
    The hierarchy is expressed by 'breadcrumb' key.
    Example:
        Following hierarchy:

            - .home  # level 1
              - doc.pdf
              - My Docs  # level 2
                - doc1.pdf  # level 3
                - doc2.pdf
              - My Invoices
                - inv.pdf
            - .inbox

        My be expressed as [
            {'breadcrumb': '.home/'},
            {'breadcrumb': '.home/My Docs/'},
            {'breadcrumb': '.home/My Docs/doc1.pdf'},
            {'breadcrumb': '.home/My Docs/doc2.pdf'},
            {'breadcrumb': '.home/My Invoices/'},
            {'breadcrumb': '.home/My Invoices/inv.pdf'},
            {'breadcrumb': '.inbox/'},
        ]
        The 'correct' order by which RestoreSequence iterates is higher level
        nodes comes before lower level nodes.
        Sticking to example from above, Restore sequence will iterate
        in following order:
            {'breadcrumb': '.home/'},   # level 1
            {'breadcrumb': '.inbox/'},  # level 1
            {'breadcrumb': '.home/My Docs/'},  # level 2
            {'breadcrumb': '.home/My Invoices/'},  # level 2
            {'breadcrumb': '.home/doc.pdf'},  # level 2
            {'breadcrumb': '.home/My Docs/doc1.pdf'}  # level 3
            {'breadcrumb': '.home/My Docs/doc2.pdf'}   # level 3
            {'breadcrumb': '.home/My Invoices/inv.pdf'}  # level 3

        It is very important to understand that on same level folders are
        yielded before documents.
        If breadcrumb string ends with '/' characters - it means that given
        nodes is a folder.
    """
    def __init__(self, nodes: list[dict]):
        self._nodes = nodes

    def __iter__(self):
        for node in sorted(self._nodes, key=breadcrumb_parts_count):
            yield node


def breadcrumb_to_path(breadcrumb: list[str], prefix: str = None) -> PurePath:
    if prefix:
        return PurePath(prefix, *breadcrumb)

    return PurePath(*breadcrumb)


def mkdirs(breadcrumb: PurePath, user: models.User) -> models.Folder | None:
    """no error if existing, make parent directories as needed"""
    parent = None
    parents_and_self = list(reversed(breadcrumb.parents))
    parents_and_self.append(breadcrumb)

    for pure_path in parents_and_self:
        parent = mkdir(pure_path, user=user, parent=parent)

    return parent


def mkdir(
    breadcrumb: PurePath,
    *,
    parent: models.Folder | None,
    user: models.User
) -> models.Folder | None:
    """no error if existing, make Folder as needed

    Returns folder which was matched or created
    """

    if breadcrumb == PurePath('.') and parent is None:
        # ".home".parents => returns ["."]
        return parent

    try:
        found = models.Folder.objects.get_by_breadcrumb(
            str(breadcrumb),
            user
        )
    except models.Folder.DoesNotExist:
        created = models.Folder.objects.create(
            title=breadcrumb.name,
            parent=parent,
            user=user
        )

        return created

    return found
