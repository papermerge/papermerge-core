import pytest
from django.conf import settings
from salinic import IndexRW, create_engine

from papermerge.core.models import User
from papermerge.search.schema import Model
from papermerge.test.types import AuthTestClient


@pytest.mark.django_db(transaction=True)
def test_basic(
    auth_api_client: AuthTestClient,
    tmp_path
):
    """Checks that search returns only documents belonging to current user """
    current_user: User = auth_api_client.user
    d = tmp_path / "index_db"
    d.mkdir()

    d = d / "test_db"
    d.mkdir()

    SEARCH_URL = f"xapian:///{d}"
    engine = create_engine(SEARCH_URL)

    index = IndexRW(engine, schema=Model)

    # document belong to current user
    doc_1 = Model(
        id='one',
        document_id='doc_1',
        title='Anmeldung',
        user_id=str(current_user.id),
        parent_id='parent_id',
        entity_type='page',
        breadcrumb=[('home', 'home_id')]
    )
    index.add(doc_1)

    # document does not belong to current user
    doc_2 = Model(
        id='two',
        document_id='doc_2',
        title='Anmeldung',
        user_id='i-belong-to-other-user',
        parent_id='parent_id_2',
        entity_type='page',
        breadcrumb=[('home', 'home_id')]
    )
    index.add(doc_2)

    settings.SEARCH_URL = SEARCH_URL
    response = auth_api_client.get("/search?q=Anmeldung")

    assert response.status_code == 200

    returned_models = response.json()
    assert len(returned_models) == 1  # only one document is returned

    # and the (only) returned document is the one belonging to the current user
    returned_model = returned_models[0]
    assert returned_model['id'] == doc_1.model_dump()['id']
