"""v3.6.0: 0014 -- Create special folder model

Revision ID: 6a88d61a7c74
Revises: 66b931500e55
Create Date: 2025-10-12 07:45:45.622278

This migration:
1. Creates the special_folders table with correct lowercase enum values
2. Migrates existing home/inbox data from users and groups tables
3. Removes old columns from both tables
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6a88d61a7c74'
down_revision: Union[str, None] = '66b931500e55'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # =========================================================================
    # STEP 1: Create special_folders table with CORRECT enum values (lowercase)
    # =========================================================================
    op.create_table('special_folders',
        sa.Column('id', sa.UUID(), nullable=False),
        # FIXED: Use lowercase 'user' and 'group', not 'USER' and 'GROUP'
        sa.Column('owner_type',
                  sa.Enum('user', 'group', name='owner_type_enum'),
                  nullable=False,
                  comment="Type of owner: 'user' or 'group'"),
        sa.Column('owner_id', sa.UUID(), nullable=False,
                  comment='UUID of the user or group that owns this special folder'),
        # FIXED: Use lowercase 'home' and 'inbox', not 'HOME' and 'INBOX'
        sa.Column('folder_type',
                  sa.Enum('home', 'inbox', name='folder_type_enum'),
                  nullable=False,
                  comment="Type of special folder: 'home', 'inbox', etc."),
        sa.Column('folder_id', sa.UUID(), nullable=False,
                  comment='Reference to the actual folder in the nodes/folders table'),
        sa.Column('created_at',
                  postgresql.TIMESTAMP(timezone=True),
                  server_default=sa.text('now()'),
                  nullable=False),
        sa.Column('updated_at',
                  postgresql.TIMESTAMP(timezone=True),
                  server_default=sa.text('now()'),
                  nullable=False),
        sa.ForeignKeyConstraint(['folder_id'], ['folders.node_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('owner_type', 'owner_id', 'folder_type',
                           name='uq_special_folder_per_owner')
    )

    # Create indexes
    op.create_index('idx_special_folders_folder_id', 'special_folders', ['folder_id'], unique=False)
    op.create_index('idx_special_folders_owner', 'special_folders', ['owner_type', 'owner_id'], unique=False)
    op.create_index(op.f('ix_special_folders_folder_id'), 'special_folders', ['folder_id'], unique=False)
    op.create_index(op.f('ix_special_folders_owner_id'), 'special_folders', ['owner_id'], unique=False)
    op.create_index(op.f('ix_special_folders_owner_type'), 'special_folders', ['owner_type'], unique=False)

    # =========================================================================
    # STEP 2: Migrate existing data from USERS table
    # =========================================================================
    print("Migrating user home folders...")
    op.execute("""
        INSERT INTO special_folders (id, owner_type, owner_id, folder_type, folder_id, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            'user'::owner_type_enum,
            id,
            'home'::folder_type_enum,
            home_folder_id,
            created_at,
            updated_at
        FROM users
        WHERE home_folder_id IS NOT NULL
    """)

    print("Migrating user inbox folders...")
    op.execute("""
        INSERT INTO special_folders (id, owner_type, owner_id, folder_type, folder_id, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            'user'::owner_type_enum,
            id,
            'inbox'::folder_type_enum,
            inbox_folder_id,
            created_at,
            updated_at
        FROM users
        WHERE inbox_folder_id IS NOT NULL
    """)

    # =========================================================================
    # STEP 3: Migrate existing data from GROUPS table
    # =========================================================================
    print("Migrating group home folders...")
    op.execute("""
        INSERT INTO special_folders (id, owner_type, owner_id, folder_type, folder_id, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            'group'::owner_type_enum,
            id,
            'home'::folder_type_enum,
            home_folder_id,
            created_at,
            updated_at
        FROM groups
        WHERE home_folder_id IS NOT NULL
    """)

    print("Migrating group inbox folders...")
    op.execute("""
        INSERT INTO special_folders (id, owner_type, owner_id, folder_type, folder_id, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            'group'::owner_type_enum,
            id,
            'inbox'::folder_type_enum,
            inbox_folder_id,
            created_at,
            updated_at
        FROM groups
        WHERE inbox_folder_id IS NOT NULL
    """)

    print("✓ Data migration complete!")

    # =========================================================================
    # STEP 4: Remove old columns from GROUPS table
    # =========================================================================
    op.drop_constraint('groups_home_folder_id_fkey', 'groups', type_='foreignkey')
    op.drop_constraint('groups_inbox_folder_id_fkey', 'groups', type_='foreignkey')
    op.drop_column('groups', 'inbox_folder_id')
    op.drop_column('groups', 'home_folder_id')
    op.drop_column('groups', 'delete_special_folders')

    # =========================================================================
    # STEP 5: Remove old columns from USERS table
    # =========================================================================
    op.drop_constraint('users_home_folder_id_fkey', 'users', type_='foreignkey')
    op.drop_constraint('users_inbox_folder_id_fkey', 'users', type_='foreignkey')
    op.drop_column('users', 'home_folder_id')
    op.drop_column('users', 'inbox_folder_id')

    print("✓ Removed old columns from users and groups tables")

    # =========================================================================
    # STEP 6: Other indexes (from auto-generated code)
    # =========================================================================
    op.create_index(op.f('ix_custom_fields_type_handler'), 'custom_fields', ['type_handler'], unique=False)


def downgrade() -> None:
    """Restore old schema (for development/rollback only)"""

    # =========================================================================
    # STEP 1: Add columns back to users and groups
    # =========================================================================
    op.add_column('users', sa.Column('inbox_folder_id', sa.UUID(), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('home_folder_id', sa.UUID(), autoincrement=False, nullable=True))
    op.add_column('groups', sa.Column('delete_special_folders', sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column('groups', sa.Column('home_folder_id', sa.UUID(), autoincrement=False, nullable=True))
    op.add_column('groups', sa.Column('inbox_folder_id', sa.UUID(), autoincrement=False, nullable=True))

    # =========================================================================
    # STEP 2: Restore data to users table
    # =========================================================================
    print("Restoring user home folders...")
    op.execute("""
        UPDATE users u
        SET home_folder_id = sf.folder_id
        FROM special_folders sf
        WHERE sf.owner_type = 'user'
          AND sf.owner_id = u.id
          AND sf.folder_type = 'home'
    """)

    print("Restoring user inbox folders...")
    op.execute("""
        UPDATE users u
        SET inbox_folder_id = sf.folder_id
        FROM special_folders sf
        WHERE sf.owner_type = 'user'
          AND sf.owner_id = u.id
          AND sf.folder_type = 'inbox'
    """)

    # =========================================================================
    # STEP 3: Restore data to groups table
    # =========================================================================
    print("Restoring group home folders...")
    op.execute("""
        UPDATE groups g
        SET home_folder_id = sf.folder_id
        FROM special_folders sf
        WHERE sf.owner_type = 'group'
          AND sf.owner_id = g.id
          AND sf.folder_type = 'home'
    """)

    print("Restoring group inbox folders...")
    op.execute("""
        UPDATE groups g
        SET inbox_folder_id = sf.folder_id
        FROM special_folders sf
        WHERE sf.owner_type = 'group'
          AND sf.owner_id = g.id
          AND sf.folder_type = 'inbox'
    """)

    print("✓ Data restore complete!")

    # =========================================================================
    # STEP 4: Restore foreign key constraints
    # =========================================================================
    op.create_foreign_key('users_inbox_folder_id_fkey', 'users', 'folders',
                         ['inbox_folder_id'], ['node_id'],
                         ondelete='CASCADE', deferrable=True)
    op.create_foreign_key('users_home_folder_id_fkey', 'users', 'folders',
                         ['home_folder_id'], ['node_id'],
                         ondelete='CASCADE', deferrable=True)
    op.create_foreign_key('groups_inbox_folder_id_fkey', 'groups', 'folders',
                         ['inbox_folder_id'], ['node_id'],
                         ondelete='CASCADE', deferrable=True)
    op.create_foreign_key('groups_home_folder_id_fkey', 'groups', 'folders',
                         ['home_folder_id'], ['node_id'],
                         ondelete='CASCADE', deferrable=True)

    # =========================================================================
    # STEP 5: Drop special_folders table and indexes
    # =========================================================================
    op.drop_index(op.f('ix_custom_fields_type_handler'), table_name='custom_fields')
    op.drop_index(op.f('ix_special_folders_owner_type'), table_name='special_folders')
    op.drop_index(op.f('ix_special_folders_owner_id'), table_name='special_folders')
    op.drop_index(op.f('ix_special_folders_folder_id'), table_name='special_folders')
    op.drop_index('idx_special_folders_owner', table_name='special_folders')
    op.drop_index('idx_special_folders_folder_id', table_name='special_folders')
    op.drop_table('special_folders')

    # =========================================================================
    # STEP 6: Drop ENUM types
    # =========================================================================
    op.execute('DROP TYPE IF EXISTS folder_type_enum CASCADE')
    op.execute('DROP TYPE IF EXISTS owner_type_enum CASCADE')

    print("✓ Downgrade complete!")
