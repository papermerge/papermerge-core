import logging
import math
import uuid
from collections.abc import Sequence
from typing import TypeVar, Union
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import selectin_polymorphic

from papermerge.core.db.engine import Session
from papermerge.core.features.document.db import orm as doc_orm
from papermerge.core.features.nodes.db.orm import Folder, Node
from papermerge.core.features.document import schema as doc_schema
from papermerge.core.features.tags.db.orm import Tag
from papermerge.core.features.nodes import schema as nodes_schema
from papermerge.core.types import PaginatedResponse

from .common import get_ancestors

T = TypeVar("T")


logger = logging.getLogger(__name__)


def get_nodes(
    db_session: Session, node_ids: list[uuid.UUID]
) -> list[doc_schema.Document | nodes_schema.Folder]:
    items = []
    with db_session as session:
        if len(node_ids) > 0:
            stmt = select(Node).filter(Node.id.in_(node_ids))
        else:
            stmt = select(Node)

        nodes = session.scalars(stmt).all()
        # colored_tags_stmt = select(ColoredTag).where(
        #    ColoredTag.object_id.in_([n.id for n in nodes])
        # )
        # colored_tags = session.scalars(colored_tags_stmt).all()

        # for node in nodes:
        #    tags = _get_tags_for(colored_tags, node.id)
        #    ancestors = get_ancestors(db_session, node.id, include_self=False)
        #    node.tags = tags
        #    node.breadcrumb = ancestors
        #    if node.ctype == "folder":
        #        items.append(nodes_schema.Folder.model_validate(node))
        #    else:
        #        items.append(doc_schema.Document.model_validate(node))

    return items


def _get_tags_for(colored_tags: Sequence[Tag], node_id: UUID) -> list[doc_schema.Tag]:
    node_tags = []

    for color_tag in colored_tags:
        if color_tag.object_id == node_id:
            node_tags.append(doc_schema.Tag.model_validate(color_tag.tag))

    return node_tags
