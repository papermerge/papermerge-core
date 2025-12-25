"""ownership refactoring

Revision ID: e077d2695f3f
Revises: 8235f6e5cbb2
Create Date: 2025-10-12 10:32:04.556070

This migration:
1. Creates the new ownerships table
2. Migrates existing data from user_id/group_id to ownerships
3. Validates data migration
4. Removes old columns and constraints
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e077d2695f3f'
down_revision: Union[str, None] = '8235f6e5cbb2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Migration strategy:
    1. Create ownerships table
    2. Migrate data from each resource table
    3. Validate migration
    4. Drop old columns and constraints
    """

    # =========================================================================
    # STEP 1: Create ownerships table
    # =========================================================================
    print("Creating ownerships table...")

    op.create_table(
        'ownerships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('owner_type', sa.String(length=20), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resource_type', sa.String(length=50), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),

        # Constraints
        sa.CheckConstraint(
            "owner_type IN ('user', 'group', 'project', 'workspace')",
            name='ownerships_owner_type_check'
        ),
        sa.CheckConstraint(
            "resource_type IN ('node', 'custom_field', 'document_type', 'tag')",
            name='ownerships_resource_type_check'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resource_type', 'resource_id', name='uq_resource_owner')
    )

    # Create indexes
    op.create_index('idx_ownerships_owner', 'ownerships', ['owner_type', 'owner_id'], unique=False)
    op.create_index('idx_ownerships_owner_resource', 'ownerships', ['owner_type', 'owner_id', 'resource_type'], unique=False)
    op.create_index('idx_ownerships_resource', 'ownerships', ['resource_type', 'resource_id'], unique=False)

    print("✓ Ownerships table created")

    # =========================================================================
    # STEP 2: Migrate data from nodes table
    # =========================================================================
    print("\nMigrating nodes ownership data...")

    connection = op.get_bind()

    # Migrate user-owned nodes (CORRECTED: use n.id not n.node_id)
    result = connection.execute(text("""
        INSERT INTO ownerships (owner_type, owner_id, resource_type, resource_id, created_at)
        SELECT
            'user' as owner_type,
            user_id as owner_id,
            'node' as resource_type,
            id as resource_id,
            COALESCE(created_at, NOW()) as created_at
        FROM nodes
        WHERE user_id IS NOT NULL
          AND deleted_at IS NULL
    """))
    print(f"  ✓ Migrated {result.rowcount} user-owned nodes")

    # Migrate group-owned nodes (CORRECTED: use n.id not n.node_id)
    result = connection.execute(text("""
        INSERT INTO ownerships (owner_type, owner_id, resource_type, resource_id, created_at)
        SELECT
            'group' as owner_type,
            group_id as owner_id,
            'node' as resource_type,
            id as resource_id,
            COALESCE(created_at, NOW()) as created_at
        FROM nodes
        WHERE group_id IS NOT NULL
          AND user_id IS NULL
          AND deleted_at IS NULL
    """))
    print(f"  ✓ Migrated {result.rowcount} group-owned nodes")

    # =========================================================================
    # STEP 3: Migrate data from custom_fields table
    # =========================================================================
    print("\nMigrating custom_fields ownership data...")

    # Migrate user-owned custom fields
    result = connection.execute(text("""
        INSERT INTO ownerships (owner_type, owner_id, resource_type, resource_id, created_at)
        SELECT
            'user' as owner_type,
            user_id as owner_id,
            'custom_field' as resource_type,
            id as resource_id,
            COALESCE(created_at, NOW()) as created_at
        FROM custom_fields
        WHERE user_id IS NOT NULL
          AND deleted_at IS NULL
    """))
    print(f"  ✓ Migrated {result.rowcount} user-owned custom fields")

    # Migrate group-owned custom fields
    result = connection.execute(text("""
        INSERT INTO ownerships (owner_type, owner_id, resource_type, resource_id, created_at)
        SELECT
            'group' as owner_type,
            group_id as owner_id,
            'custom_field' as resource_type,
            id as resource_id,
            COALESCE(created_at, NOW()) as created_at
        FROM custom_fields
        WHERE group_id IS NOT NULL
          AND user_id IS NULL
          AND deleted_at IS NULL
    """))
    print(f"  ✓ Migrated {result.rowcount} group-owned custom fields")

    # =========================================================================
    # STEP 4: Migrate data from document_types table
    # =========================================================================
    print("\nMigrating document_types ownership data...")

    # Migrate user-owned document types
    result = connection.execute(text("""
        INSERT INTO ownerships (owner_type, owner_id, resource_type, resource_id, created_at)
        SELECT
            'user' as owner_type,
            user_id as owner_id,
            'document_type' as resource_type,
            id as resource_id,
            COALESCE(created_at, NOW()) as created_at
        FROM document_types
        WHERE user_id IS NOT NULL
          AND deleted_at IS NULL
    """))
    print(f"  ✓ Migrated {result.rowcount} user-owned document types")

    # Migrate group-owned document types
    result = connection.execute(text("""
        INSERT INTO ownerships (owner_type, owner_id, resource_type, resource_id, created_at)
        SELECT
            'group' as owner_type,
            group_id as owner_id,
            'document_type' as resource_type,
            id as resource_id,
            COALESCE(created_at, NOW()) as created_at
        FROM document_types
        WHERE group_id IS NOT NULL
          AND user_id IS NULL
          AND deleted_at IS NULL
    """))
    print(f"  ✓ Migrated {result.rowcount} group-owned document types")

    # =========================================================================
    # STEP 5: Migrate data from tags table
    # =========================================================================
    print("\nMigrating tags ownership data...")

    # Migrate user-owned tags
    result = connection.execute(text("""
        INSERT INTO ownerships (owner_type, owner_id, resource_type, resource_id, created_at)
        SELECT
            'user' as owner_type,
            user_id as owner_id,
            'tag' as resource_type,
            id as resource_id,
            COALESCE(created_at, NOW()) as created_at
        FROM tags
        WHERE user_id IS NOT NULL
          AND deleted_at IS NULL
    """))
    print(f"  ✓ Migrated {result.rowcount} user-owned tags")

    # Migrate group-owned tags
    result = connection.execute(text("""
        INSERT INTO ownerships (owner_type, owner_id, resource_type, resource_id, created_at)
        SELECT
            'group' as owner_type,
            group_id as owner_id,
            'tag' as resource_type,
            id as resource_id,
            COALESCE(created_at, NOW()) as created_at
        FROM tags
        WHERE group_id IS NOT NULL
          AND user_id IS NULL
          AND deleted_at IS NULL
    """))
    print(f"  ✓ Migrated {result.rowcount} group-owned tags")

    # =========================================================================
    # STEP 6: Validation - check for orphaned resources
    # =========================================================================
    print("\n" + "="*60)
    print("VALIDATION: Checking for orphaned resources...")
    print("="*60)

    # Check nodes without ownership (CORRECTED: use n.id not n.node_id)
    result = connection.execute(text("""
        SELECT COUNT(*)
        FROM nodes n
        LEFT JOIN ownerships o ON o.resource_type = 'node' AND o.resource_id = n.id
        WHERE o.id IS NULL
          AND n.deleted_at IS NULL
          AND (n.user_id IS NOT NULL OR n.group_id IS NOT NULL)
    """))
    orphaned_nodes = result.scalar()

    # Check custom_fields without ownership
    result = connection.execute(text("""
        SELECT COUNT(*)
        FROM custom_fields cf
        LEFT JOIN ownerships o ON o.resource_type = 'custom_field' AND o.resource_id = cf.id
        WHERE o.id IS NULL
          AND cf.deleted_at IS NULL
          AND (cf.user_id IS NOT NULL OR cf.group_id IS NOT NULL)
    """))
    orphaned_custom_fields = result.scalar()

    # Check document_types without ownership
    result = connection.execute(text("""
        SELECT COUNT(*)
        FROM document_types dt
        LEFT JOIN ownerships o ON o.resource_type = 'document_type' AND o.resource_id = dt.id
        WHERE o.id IS NULL
          AND dt.deleted_at IS NULL
          AND (dt.user_id IS NOT NULL OR dt.group_id IS NOT NULL)
    """))
    orphaned_document_types = result.scalar()

    # Check tags without ownership
    result = connection.execute(text("""
        SELECT COUNT(*)
        FROM tags t
        LEFT JOIN ownerships o ON o.resource_type = 'tag' AND o.resource_id = t.id
        WHERE o.id IS NULL
          AND t.deleted_at IS NULL
          AND (t.user_id IS NOT NULL OR t.group_id IS NOT NULL)
    """))
    orphaned_tags = result.scalar()

    total_orphaned = orphaned_nodes + orphaned_custom_fields + orphaned_document_types + orphaned_tags

    if total_orphaned > 0:
        print(f"\n⚠️  WARNING: Found {total_orphaned} orphaned resources:")
        print(f"  - Nodes: {orphaned_nodes}")
        print(f"  - Custom Fields: {orphaned_custom_fields}")
        print(f"  - Document Types: {orphaned_document_types}")
        print(f"  - Tags: {orphaned_tags}")
        print("\nThese resources had user_id or group_id but weren't migrated.")
        print("This might happen if referenced users/groups were deleted.")
        print("Consider investigating before proceeding.\n")
    else:
        print("✓ All resources successfully migrated - no orphans found")

    # Print migration summary
    result = connection.execute(text("""
        SELECT
            resource_type,
            owner_type,
            COUNT(*) as count
        FROM ownerships
        GROUP BY resource_type, owner_type
        ORDER BY resource_type, owner_type
    """))

    print("\n" + "="*60)
    print("MIGRATION SUMMARY:")
    print("="*60)
    for row in result:
        print(f"  {row.resource_type:20s} owned by {row.owner_type:10s}: {row.count:6d}")
    print("="*60 + "\n")

    # =========================================================================
    # STEP 7: Drop old columns and constraints
    # =========================================================================
    # CUSTOM FIELDS
    op.drop_index('ix_custom_fields_group_id', table_name='custom_fields')
    op.drop_index('ix_custom_fields_user_id', table_name='custom_fields')
    op.drop_constraint('custom_fields_user_id_fkey', 'custom_fields', type_='foreignkey')
    op.drop_constraint('custom_fields_group_id_fkey', 'custom_fields', type_='foreignkey')
    op.drop_column('custom_fields', 'group_id')
    op.drop_column('custom_fields', 'user_id')

    # DOCUMENT TYPES
    op.drop_constraint('unique document type per group', 'document_types', type_='unique')
    op.drop_constraint('unique document type per user', 'document_types', type_='unique')
    op.drop_constraint('document_types_user_id_fkey', 'document_types', type_='foreignkey')
    op.drop_constraint('document_types_group_id_fkey', 'document_types', type_='foreignkey')
    op.drop_column('document_types', 'group_id')
    op.drop_column('document_types', 'user_id')

    # NODES
    op.drop_constraint('unique title per parent per group', 'nodes', type_='unique')
    op.drop_constraint('unique title per parent per user', 'nodes', type_='unique')
    op.drop_constraint('nodes_user_id_fkey', 'nodes', type_='foreignkey')
    op.drop_constraint('nodes_group_id_fkey', 'nodes', type_='foreignkey')
    op.drop_column('nodes', 'group_id')
    op.drop_column('nodes', 'user_id')

    # TAGS
    op.drop_constraint('unique tag name per group', 'tags', type_='unique')
    op.drop_constraint('unique tag name per user', 'tags', type_='unique')
    op.drop_constraint('tag_user_id_fk', 'tags', type_='foreignkey')
    op.drop_constraint('tags_group_id_fkey', 'tags', type_='foreignkey')
    op.drop_column('tags', 'group_id')
    op.drop_column('tags', 'user_id')
    print("  ✓ Cleaned tags")



def downgrade() -> None:
    """
    Rollback migration - restore old schema and data

    WARNING: This will fail if:
    1. New owner types (project, workspace) were added
    2. Resources were created with the new system
    """

    print("\n" + "="*60)
    print("⚠️  ROLLING BACK OWNERSHIP MIGRATION")
    print("="*60)

    connection = op.get_bind()

    # =========================================================================
    # STEP 1: Re-add old columns
    # =========================================================================
    print("\nRestoring old columns...")

    # TAGS
    op.add_column('tags', sa.Column('user_id', postgresql.UUID(), autoincrement=False, nullable=True))
    op.add_column('tags', sa.Column('group_id', postgresql.UUID(), autoincrement=False, nullable=True))

    # NODES
    op.add_column('nodes', sa.Column('user_id', postgresql.UUID(), autoincrement=False, nullable=True))
    op.add_column('nodes', sa.Column('group_id', postgresql.UUID(), autoincrement=False, nullable=True))

    # DOCUMENT TYPES
    op.add_column('document_types', sa.Column('user_id', postgresql.UUID(), autoincrement=False, nullable=True))
    op.add_column('document_types', sa.Column('group_id', postgresql.UUID(), autoincrement=False, nullable=True))

    # CUSTOM FIELDS
    op.add_column('custom_fields', sa.Column('user_id', postgresql.UUID(), autoincrement=False, nullable=True))
    op.add_column('custom_fields', sa.Column('group_id', postgresql.UUID(), autoincrement=False, nullable=True))

    print("  ✓ Columns restored")

    # =========================================================================
    # STEP 2: Migrate data back from ownerships table
    # =========================================================================
    print("\nMigrating data back from ownerships...")

    # Restore tags
    connection.execute(text("""
        UPDATE tags t
        SET user_id = o.owner_id
        FROM ownerships o
        WHERE o.resource_type = 'tag'
          AND o.resource_id = t.id
          AND o.owner_type = 'user'
    """))

    connection.execute(text("""
        UPDATE tags t
        SET group_id = o.owner_id
        FROM ownerships o
        WHERE o.resource_type = 'tag'
          AND o.resource_id = t.id
          AND o.owner_type = 'group'
    """))
    print("  ✓ Tags restored")

    # Restore nodes (CORRECTED: use n.id not n.node_id)
    connection.execute(text("""
        UPDATE nodes n
        SET user_id = o.owner_id
        FROM ownerships o
        WHERE o.resource_type = 'node'
          AND o.resource_id = n.id
          AND o.owner_type = 'user'
    """))

    connection.execute(text("""
        UPDATE nodes n
        SET group_id = o.owner_id
        FROM ownerships o
        WHERE o.resource_type = 'node'
          AND o.resource_id = n.id
          AND o.owner_type = 'group'
    """))
    print("  ✓ Nodes restored")

    # Restore document_types
    connection.execute(text("""
        UPDATE document_types dt
        SET user_id = o.owner_id
        FROM ownerships o
        WHERE o.resource_type = 'document_type'
          AND o.resource_id = dt.id
          AND o.owner_type = 'user'
    """))

    connection.execute(text("""
        UPDATE document_types dt
        SET group_id = o.owner_id
        FROM ownerships o
        WHERE o.resource_type = 'document_type'
          AND o.resource_id = dt.id
          AND o.owner_type = 'group'
    """))
    print("  ✓ Document types restored")

    # Restore custom_fields
    connection.execute(text("""
        UPDATE custom_fields cf
        SET user_id = o.owner_id
        FROM ownerships o
        WHERE o.resource_type = 'custom_field'
          AND o.resource_id = cf.id
          AND o.owner_type = 'user'
    """))

    connection.execute(text("""
        UPDATE custom_fields cf
        SET group_id = o.owner_id
        FROM ownerships o
        WHERE o.resource_type = 'custom_field'
          AND o.resource_id = cf.id
          AND o.owner_type = 'group'
    """))
    print("  ✓ Custom fields restored")

    # =========================================================================
    # STEP 3: Restore constraints
    # =========================================================================
    print("\nRestoring constraints...")

    # TAGS
    op.create_foreign_key('tags_group_id_fkey', 'tags', 'groups', ['group_id'], ['id'])
    op.create_foreign_key('tag_user_id_fk', 'tags', 'users', ['user_id'], ['id'])
    op.create_unique_constraint('unique tag name per user', 'tags', ['name', 'user_id'])
    op.create_unique_constraint('unique tag name per group', 'tags', ['name', 'group_id'])

    # NODES
    op.create_foreign_key('nodes_group_id_fkey', 'nodes', 'groups', ['group_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('nodes_user_id_fkey', 'nodes', 'users', ['user_id'], ['id'], ondelete='CASCADE', deferrable=True)
    op.create_unique_constraint('unique title per parent per user', 'nodes', ['parent_id', 'title', 'user_id'])
    op.create_unique_constraint('unique title per parent per group', 'nodes', ['parent_id', 'title', 'group_id'])

    # DOCUMENT TYPES
    op.create_foreign_key('document_types_group_id_fkey', 'document_types', 'groups', ['group_id'], ['id'])
    op.create_foreign_key('document_types_user_id_fkey', 'document_types', 'users', ['user_id'], ['id'])
    op.create_unique_constraint('unique document type per user', 'document_types', ['name', 'user_id'])
    op.create_unique_constraint('unique document type per group', 'document_types', ['name', 'group_id'])

    # CUSTOM FIELDS
    op.create_foreign_key('custom_fields_group_id_fkey', 'custom_fields', 'groups', ['group_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('custom_fields_user_id_fkey', 'custom_fields', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_custom_fields_user_id', 'custom_fields', ['user_id'], unique=False)
    op.create_index('ix_custom_fields_group_id', 'custom_fields', ['group_id'], unique=False)

    print("  ✓ Constraints restored")

    # =========================================================================
    # STEP 4: Drop ownerships table
    # =========================================================================
    print("\nRemoving ownerships table...")

    op.drop_index('idx_ownerships_resource', table_name='ownerships')
    op.drop_index('idx_ownerships_owner_resource', table_name='ownerships')
    op.drop_index('idx_ownerships_owner', table_name='ownerships')
    op.drop_table('ownerships')

    print("  ✓ Ownerships table removed")

    print("\n" + "="*60)
    print("✅ ROLLBACK COMPLETED")
    print("="*60)
