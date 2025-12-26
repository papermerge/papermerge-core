import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.custom_fields import types as cf_types
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.features.ownership.schema import Owner
from papermerge.core.features.custom_fields.db import orm
from papermerge.core import types


@pytest.fixture
async def make_custom_field_select(db_session: AsyncSession, user, system_user):
    """
    Create a custom field of type "select"
    """
    async def _maker(
        name: str,
        options: list[cf_types.SelectOptionInput],
        owner: Owner,
    ) -> orm.CustomField:
        config = cf_types.SelectFieldConfig(options=options)
        cf = orm.CustomField(
            id=uuid.uuid4(),
            name=name,
            type_handler="select",
            config=config.to_config_dict(),
            created_by=system_user.id,
            updated_by=system_user.id,
        )
        db_session.add(cf)
        await db_session.flush()

        await ownership_api.set_owner(
            session=db_session,
            resource=types.CustomFieldResource(id=cf.id),
            owner=owner,
        )

        await db_session.commit()
        await db_session.refresh(cf)

        return cf

    return _maker


@pytest.fixture
def make_custom_field_multiselect(db_session: AsyncSession, user, system_user):
    """
    Create a multiselect custom field with validated options
    """
    async def _maker(
        name: str,
        options: list[cf_types.SelectOptionInput],
        owner: Owner
    ) -> orm.CustomField:
        config = cf_types.MultiSelectFieldConfig(
            options=options,
        )

        cf = orm.CustomField(
            id=uuid.uuid4(),
            name=name,
            type_handler="multiselect",
            config=config.to_config_dict(),
            created_by=system_user.id,
            updated_by=system_user.id,
        )
        db_session.add(cf)
        await db_session.flush()

        await ownership_api.set_owner(
            session=db_session,
            resource=types.CustomFieldResource(id=cf.id),
            owner=owner
        )

        await db_session.commit()
        await db_session.refresh(cf)

        return cf

    return _maker
