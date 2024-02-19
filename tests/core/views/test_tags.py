import pytest

from papermerge.core.models import Tag
from papermerge.test.baker_recipes import tag_recipe
from papermerge.test.types import AuthTestClient


@pytest.mark.django_db(transaction=True)
def test_get_user_tags_no_results(auth_api_client: AuthTestClient):
    """Scenario: current user does not have any tags"""
    response = auth_api_client.get('/tags')

    assert response.status_code == 200
    items = response.json()['items']
    assert len(items) == 0


@pytest.mark.django_db(transaction=True)
def test_get_user_tags_one_tag(auth_api_client: AuthTestClient):
    """Scenario: current user has only one tag"""
    user = auth_api_client.user
    # current user has only one tag
    tag_recipe.make(name='tag1', user=user)

    response = auth_api_client.get('/tags')

    assert response.status_code == 200
    items = response.json()['items']
    assert len(items) == 1
    assert items[0]['name'] == 'tag1'


@pytest.mark.django_db(transaction=True)
def test_create_tag(auth_api_client: AuthTestClient):
    payload = {
        'name': 'tag1',
        'bg_color': '#ffaaff',
        'fg_color': '#ff0000',
        'description': 'blah',
        'pinned': False
    }

    # before tag creation user has 0 tags
    assert Tag.objects.filter(
        user=auth_api_client.user
    ).count() == 0

    response = auth_api_client.post('/tags', json=payload)
    assert response.status_code == 201
    assert response.json()['name'] == 'tag1'

    # after tag creation user has exactly 1 tag
    assert Tag.objects.filter(
        user=auth_api_client.user
    ).count() == 1


@pytest.mark.django_db(transaction=True)
def test_create_duplicate_tag_for_same_user(auth_api_client: AuthTestClient):
    """
    Duplicate tags will return 400 validation error.

    The point is that (tag.name, user_id) pairs must be unique i.e.
    tag names are unique per user.
    """
    payload = {
        'name': 'tag1',
        'bg_color': '#ffaaff',
        'fg_color': '#ff0000',
        'description': 'blah',
        'pinned': False
    }

    # create new tag
    response = auth_api_client.post('/tags', json=payload)

    assert response.status_code == 201
    assert response.json()['name'] == 'tag1'
    # user has one tag
    assert Tag.objects.filter(
        user=auth_api_client.user
    ).count() == 1

    response = auth_api_client.post('/tags', json=payload)
    assert response.status_code == 400
    assert response.json() == {'detail': 'Tag already exists'}
    # user still has only one tag
    assert Tag.objects.filter(
        user=auth_api_client.user
    ).count() == 1


@pytest.mark.django_db(transaction=True)
def test_delete_tag(auth_api_client: AuthTestClient):
    user = auth_api_client.user
    # current user has only one tag
    tag = tag_recipe.make(name='tag1', user=user)

    # user has one tag
    assert Tag.objects.filter(
        user=auth_api_client.user
    ).count() == 1

    response = auth_api_client.delete(f'/tags/{tag.id}')
    assert response.status_code == 204

    # user does not have tags anymore
    assert Tag.objects.filter(
        user=auth_api_client.user
    ).count() == 0


@pytest.mark.django_db(transaction=True)
def test_update_tag_pass_bg_color_field(auth_api_client: AuthTestClient):
    user = auth_api_client.user
    # current user has only one tag
    tag = tag_recipe.make(
        name='tag1',
        bg_color='#ffffff',
        user=user
    )

    payload = {
        'bg_color': '#ff0011'
    }
    response = auth_api_client.patch(f'/tags/{tag.id}', json=payload)
    assert response.status_code == 200

    update_tag = Tag.objects.get(id=tag.id, user=auth_api_client.user)
    assert update_tag.bg_color == '#ff0011'


@pytest.mark.django_db(transaction=True)
def test_update_tag_pass_two_fields(auth_api_client: AuthTestClient):
    user = auth_api_client.user
    # current user has only one tag
    tag = tag_recipe.make(
        name='tag1',
        bg_color='#ffffff',
        user=user
    )

    payload = {
        'bg_color': '#ff0011',
        'name': 'edited_tag_name'
    }
    response = auth_api_client.patch(f'/tags/{tag.id}', json=payload)

    assert response.status_code == 200, response.content

    update_tag = Tag.objects.get(id=tag.id, user=auth_api_client.user)
    assert update_tag.bg_color == '#ff0011'
    assert update_tag.name == 'edited_tag_name'
