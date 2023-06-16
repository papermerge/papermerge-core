import pytest
from papermerge.core.models import User, Folder
from papermerge.core.schemas.nodes import Node as PyNode
from papermerge.core.schemas.nodes import NodeType


@pytest.mark.django_db
def test_basic_folder(user: User):
    pynode = PyNode.from_orm(user.home_folder)

    assert pynode.title == Folder.HOME_TITLE
    assert pynode.ctype == NodeType.folder
