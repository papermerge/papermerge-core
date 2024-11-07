import datetime
import uuid

from papermerge.core import schema, orm


def test_model_validate_for_user(user: orm.User):
    pyuser = schema.User.model_validate(user)

    assert pyuser.username == user.username


def test_user_has_sorted_scopes():
    user_model = schema.User(
        id=uuid.uuid4(),
        email="erasmus@mail.com",
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
        home_folder_id=uuid.uuid4(),
        inbox_folder_id=uuid.uuid4(),
        username="erasmus",
        scopes=["c", "a", "b"],
    )
    user = schema.User.model_validate(user_model)

    assert user.scopes == ["a", "b", "c"]


def test_user_has_sorted_scopes2():
    user_model = schema.User(
        id=uuid.uuid4(),
        email="erasmus@mail.com",
        created_at=datetime.datetime.now(),
        updated_at=datetime.datetime.now(),
        home_folder_id=uuid.uuid4(),
        inbox_folder_id=uuid.uuid4(),
        username="erasmus",
        scopes=[
            "node.delete",
            "tag.delete",
            "tag.create",
            "tag.update",
            "node.update",
            "task.ocr",
        ],
    )
    user = schema.User.model_validate(user_model)

    assert user.scopes == [
        "node.delete",
        "node.update",
        "tag.create",
        "tag.delete",
        "tag.update",
        "task.ocr",
    ]
