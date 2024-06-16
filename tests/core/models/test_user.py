from unittest.mock import patch

from django.contrib.auth.models import Permission
from model_bakery import baker
from sqlalchemy import Engine
from sqlalchemy.orm import sessionmaker

from papermerge.core import db, schemas
from papermerge.core.models import User
from papermerge.test import TestCase


def _perm(name):
    return Permission.objects.get(codename=name)


class TestUserModel(TestCase):

    def test_basic_user_create(self):
        User.objects.create(username='me')

    @patch('papermerge.core.signals.delete_user_data_task')
    def test_basic_user_create_and_delete(self, _):
        """
        Check that we can create/delete user without any nodes
        associated.
        """
        # create user
        user = baker.make('core.user')
        # make sure that deleting user without any nodes associated does not
        # raise any exception
        user.delete()

    @patch('papermerge.core.signals.delete_user_data_task')
    def test_user_can_be_deleted_even_if_he_has_associated_documents(self, _):
        """
        Makes sure that user model can be deleted if it has associated
        documents (i.e. user has some documents associated)
        """
        user = baker.make('core.user')
        baker.make('core.Document', user=user)
        user.delete()


def test_get_user_details(db_engine: Engine):
    Session = sessionmaker(db_engine)
    db_session = Session()

    with db_session as session:
        db.sync_perms(session)

    g1 = db.create_group(
        db_session,
        "G1",
        scopes=[]
    )
    g2 = db.create_group(
        db_session,
        "G2",
        scopes=[]
    )

    scopes = ['tag.update', 'tag.create']

    user: schemas.User = db.create_user(
        db_engine,
        username='socrates',
        email='socrates@mail.com',
        password='wisdom71',
        scopes=['tag.update', 'tag.create'],
        group_ids=[g1.id, g2.id]
    )

    # fetch user details; here we are interested in
    # user's groups and user's scopes
    user_details: schemas.UserDetails = db.get_user_details(
        db_engine, user_id=user.id
    )

    group_ids = [g.id for g in user_details.groups]

    # user detail contains correct scopes and groups
    assert set(user_details.scopes) == set(scopes)
    assert set(group_ids) == {g1.id, g2.id}

    db.delete_group(db_session, group_id=g1.id)
    db.delete_group(db_session, group_id=g2.id)


def test_update_user(db_engine: Engine):
    Session = sessionmaker(db_engine)
    db_session = Session()

    with Session() as session:
        db.sync_perms(session)

    g1 = db.create_group(
        db_session,
        "G1",
        scopes=[]
    )
    g2 = db.create_group(
        db_session,
        "G2",
        scopes=[]
    )

    user: schemas.User = db.create_user(
        db_engine,
        username='plato',
        email='plato@mail.com',
        password='wisdom71',
        scopes=['tag.update', 'tag.create'],
        group_ids=[g1.id, g2.id]
    )

    db.update_user(
        db_engine,
        user_id=user.id,
        attrs=schemas.UpdateUser(
            username="plato",
            email="plato@mail.com",
            group_ids=[g1.id],
            scopes=['tag.update'],
            is_superuser=False,
            is_active=False,
        )
    )

    # fetch user details; here we are interested in
    # user's groups and user's scopes
    user_details: schemas.UserDetails = db.get_user_details(
        db_engine, user_id=user.id
    )

    group_ids = [g.id for g in user_details.groups]

    # user detail contains correct scopes and groups
    assert user_details.scopes == ['tag.update']
    assert group_ids == [g1.id]

    db.delete_group(db_session, group_id=g1.id)
    db.delete_group(db_session, group_id=g2.id)
