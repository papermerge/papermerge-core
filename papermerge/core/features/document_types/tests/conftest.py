import uuid
import pytest
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional

from papermerge.core import orm
from papermerge.core.features.document_types import schema
from papermerge.core.features.document_types.db import api as dt_dbapi
from papermerge.core.types import OwnerType, ResourceType
from papermerge.core.features.ownership import schema as ownership_schema


@pytest.fixture
def make_document_type_with_custom_fields(
    db_session: AsyncSession,
    user,
    make_custom_field_v2
):
    """
    Flexible fixture to create document types with custom fields.

    Based on the pattern from make_document_with_numeric_cf, this fixture:
    - Checks the database first for existing custom fields with the same name
    - Reuses existing custom fields if found
    - Creates new custom fields only if needed
    - Checks for existing document types and reuses them
    - Creates new document types only if needed

    Custom fields are specified as a list of dictionaries with:
    - name: str (required) - name of the custom field
    - type_handler: str (required) - one of: 'text', 'number', 'monetary', 'date',
                                      'datetime', 'boolean', 'year-month'
    - config: dict (optional) - configuration for the field (e.g., {'currency': 'EUR'} for monetary)

    Usage examples:
        # Create document type with multiple custom fields
        doc_type = await make_document_type_with_custom_fields(
            name="Invoice",
            custom_fields=[
                {"name": "Invoice Date", "type_handler": "date"},
                {"name": "Total Amount", "type_handler": "monetary", "config": {"currency": "USD"}},
                {"name": "Paid", "type_handler": "boolean"},
                {"name": "Description", "type_handler": "text"},
            ]
        )

        # Create another document type - fields will be reused if they exist
        doc_type2 = await make_document_type_with_custom_fields(
            name="Receipt",
            custom_fields=[
                {"name": "Invoice Date", "type_handler": "date"},  # Will reuse existing
                {"name": "Shop Name", "type_handler": "text"},
                {"name": "Total Amount", "type_handler": "monetary", "config": {"currency": "EUR"}},
            ]
        )

        # Call multiple times with same name - will reuse the document type
        doc_type3 = await make_document_type_with_custom_fields(
            name="Invoice",  # Will reuse existing "Invoice" document type
            custom_fields=[
                {"name": "Invoice Date", "type_handler": "date"},
            ]
        )
    """

    async def _maker(
        name: str,
        custom_fields: List[Dict[str, Any]],
        owner: ownership_schema.Owner | None = None,
        user_id: Optional[uuid.UUID] = None,
        group_id: Optional[uuid.UUID] = None,
        path_template: Optional[str] = None,
    ) -> orm.DocumentType:
        """
        Create or retrieve a document type with the specified custom fields.

        Args:
            name: Name of the document type
            custom_fields: List of custom field specifications
            user_id: Optional user ID for ownership (defaults to fixture user)
            group_id: Optional group ID for ownership
            path_template: Optional path template for the document type

        Returns:
            The document type with associated custom fields (existing or newly created)
        """
        # Determine owner
        if owner:
            owner_type = owner.owner_type
            owner_id = owner.owner_id
        elif group_id:
            owner_type = OwnerType.GROUP
            owner_id = group_id
        elif user_id:
            owner_type = OwnerType.USER
            owner_id = user_id
        else:
            # Default to the fixture user
            owner_type = OwnerType.USER
            owner_id = user.id

        created_custom_fields = []

        # Step 1: Process each custom field specification
        for cf_spec in custom_fields:
            cf_name = cf_spec["name"]
            cf_type = cf_spec["type_handler"]
            cf_config = cf_spec.get("config", {})

            # Check if custom field exists in database (owned by the same owner)
            stmt = select(orm.CustomField).where(
                and_(
                    orm.CustomField.name == cf_name,
                    orm.CustomField.type_handler == cf_type
                )
            ).join(
                orm.Ownership,
                and_(
                    orm.Ownership.resource_type == ResourceType.CUSTOM_FIELD.value,
                    orm.Ownership.resource_id == orm.CustomField.id,
                    orm.Ownership.owner_type == owner_type.value,
                    orm.Ownership.owner_id == owner_id
                )
            )
            result = await db_session.execute(stmt)
            existing_cf = result.scalar_one_or_none()

            if existing_cf:
                # Reuse existing custom field
                created_custom_fields.append(existing_cf)
            else:
                # Create new custom field using make_custom_field_v2
                new_cf = await make_custom_field_v2(
                    name=cf_name,
                    type_handler=cf_type,
                    config=cf_config,
                    user_id=owner_id if owner_type == OwnerType.USER else None,
                    group_id=owner_id if owner_type == OwnerType.GROUP else None
                )
                created_custom_fields.append(new_cf)

        # Step 2: Check if document type with this name already exists (owned by the same owner)
        stmt = select(orm.DocumentType).where(
            orm.DocumentType.name == name
        ).join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.DOCUMENT_TYPE.value,
                orm.Ownership.resource_id == orm.DocumentType.id,
                orm.Ownership.owner_type == owner_type.value,
                orm.Ownership.owner_id == owner_id
            )
        )
        result = await db_session.execute(stmt)
        document_type = result.scalar_one_or_none()

        if document_type is None:
            # Step 3: Create new document type using the API
            create_data = schema.CreateDocumentType(
                name=name,
                custom_field_ids=[cf.id for cf in created_custom_fields],
                owner_type=owner_type,
                owner_id=owner_id,
                path_template=path_template
            )

            document_type = await dt_dbapi.create_document_type(
                db_session,
                data=create_data
            )

        return document_type

    return _maker
