import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm, types
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.custom_fields import schema as cf_schema
from papermerge.core.features.document_types.db import api as dt_dbapi
from papermerge.core.features.document_types import schema as dt_schema
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.features.custom_fields import types as cf_types


async def test_count_select_field_single_document(
    db_session: AsyncSession,
    user,
    make_custom_field_select,
):
    """
    Count documents with a single select value.

    Setup:
    - Create custom field of type "select" named "Priority" with options: high, low
    - Create document type with the field
    - Create two documents with custom field Priority="high"

    Expected:
    - count("high") = 1
    - count("low") = 0
    """
    owner = types.Owner.create_from(user_id=user.id)
    field = await make_custom_field_select(
        name="Priority",
        options=[
            cf_types.opt(value="high", label="High"),
            cf_types.opt(value="low", label="Low")
        ],
        owner=owner
    )

    # Create document type
    dt_data = dt_schema.CreateDocumentType(
        name="Task",
        custom_field_ids=[field.id],
        owner_type=types.OwnerType.USER,
        owner_id=user.id
    )
    doc_type = await dt_dbapi.create_document_type(db_session, data=dt_data)

    # Create document
    doc1 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-1.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    doc2 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="task-1.pdf",
        document_type_id=doc_type.id,
        parent_id=user.home_folder_id,
    )
    db_session.add_all([doc1, doc2])
    await db_session.flush()

    await ownership_api.set_owners(
        session=db_session,
        resource_type=types.ResourceType.NODE,
        resource_ids=[doc1.id, doc2.id],
        owner=owner
    )

    value_data = cf_schema.SetCustomFieldValue(
        field_id=field.id,
        value="high"
    )
    await cf_dbapi.set_custom_field_value(db_session, doc1.id, value_data)
    await cf_dbapi.set_custom_field_value(db_session, doc2.id, value_data)

    high_count = await cf_dbapi.count_documents_by_option_value(
        db_session, field.id, "high", user_id=user.id
    )
    low_count = await cf_dbapi.count_documents_by_option_value(
        db_session, field.id, "low", user_id=user.id
    )

    assert high_count == 2  # used in two documents
    assert low_count == 0 # not used in any document
