from sqlalchemy import func

from papermerge.core.db.engine import Session
from papermerge.core.features.groups.db import orm
from papermerge.test.types import AuthTestClient


def test_create_group_route(auth_api_client: AuthTestClient, db_session: Session):
    count_before = db_session.query(func.count(orm.Group.id)).scalar()
    assert count_before == 0

    response = auth_api_client.post(
        "/groups/",
        json={"name": "Admin", "scopes": []},
    )

    assert response.status_code == 201, response.json()
    count_after = db_session.query(func.count(orm.Group.id)).scalar()
    assert count_after == 1
