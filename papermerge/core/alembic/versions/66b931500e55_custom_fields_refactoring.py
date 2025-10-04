"""custom fields refactoring

Revision ID: 66b931500e55
Revises: f9c92867b8a4
Create Date: 2025-10-04 07:41:03.879588

"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = '66b931500e55'
down_revision: Union[str, None] = 'f9c92867b8a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    connection = op.get_bind()

    # ========================================
    # STEP 1: CREATE IMMUTABLE HELPER FUNCTIONS
    # ========================================

    print("Step 1: Creating immutable helper functions...")

    # Helper function for DATE conversion
    connection.execute(text("""
        CREATE OR REPLACE FUNCTION jsonb_text_to_date(j jsonb)
        RETURNS date
        LANGUAGE plpgsql
        IMMUTABLE
        STRICT
        AS $$
        BEGIN
            RETURN (j->>0)::date;
        EXCEPTION WHEN OTHERS THEN
            RETURN NULL;
        END;
        $$;
    """))

    # Helper function for TIMESTAMP conversion
    connection.execute(text("""
        CREATE OR REPLACE FUNCTION jsonb_text_to_timestamp(j jsonb)
        RETURNS timestamp
        LANGUAGE plpgsql
        IMMUTABLE
        STRICT
        AS $$
        BEGIN
            RETURN (j->>0)::timestamp;
        EXCEPTION WHEN OTHERS THEN
            RETURN NULL;
        END;
        $$;
    """))

    print("  ✓ Helper functions created")

    # ========================================
    # STEP 2: CUSTOM_FIELDS TABLE CHANGES
    # ========================================

    print("Step 2: Migrating custom_fields table...")

    # Add new columns (allow NULL temporarily)
    op.add_column('custom_fields',
                  sa.Column('type_handler', sa.String(length=50), nullable=True))
    op.add_column('custom_fields',
                  sa.Column('config', postgresql.JSONB(astext_type=sa.Text()),
                            server_default='{}', nullable=True))

    # Migrate type -> type_handler
    type_mapping = {
        'text': 'text',
        'int': 'integer',
        'float': 'number',
        'date': 'date',
        'boolean': 'boolean',
        'monetary': 'monetary',
        'yearmonth': 'yearmonth',
    }

    for old_type, new_handler in type_mapping.items():
        connection.execute(
            text("UPDATE custom_fields SET type_handler = :new_handler WHERE type = :old_type"),
            {"new_handler": new_handler, "old_type": old_type}
        )

    # Migrate extra_data -> config
    result = connection.execute(
        text("SELECT id, extra_data FROM custom_fields WHERE extra_data IS NOT NULL")
    )

    for row in result:
        field_id = row[0]
        extra_data = row[1]

        try:
            config_dict = json.loads(extra_data)
            connection.execute(
                text("UPDATE custom_fields SET config = :config WHERE id = :id"),
                {"config": json.dumps(config_dict), "id": str(field_id)}
            )
        except (json.JSONDecodeError, TypeError):
            connection.execute(
                text("UPDATE custom_fields SET config = '{}' WHERE id = :id"),
                {"id": str(field_id)}
            )

    connection.execute(text("UPDATE custom_fields SET config = '{}' WHERE config IS NULL"))

    # Make type_handler NOT NULL
    op.alter_column('custom_fields', 'type_handler', nullable=False)

    # Create indexes
    op.create_index('idx_custom_fields_name', 'custom_fields', ['name'], unique=False)
    op.create_index('idx_custom_fields_type', 'custom_fields', ['type_handler'], unique=False)
    op.create_index(op.f('ix_custom_fields_group_id'), 'custom_fields', ['group_id'], unique=False)
    op.create_index(op.f('ix_custom_fields_user_id'), 'custom_fields', ['user_id'], unique=False)

    # Update foreign keys
    op.drop_constraint('custom_fields_group_id_fkey', 'custom_fields', type_='foreignkey')
    op.drop_constraint('custom_fields_user_id_fkey', 'custom_fields', type_='foreignkey')
    op.create_foreign_key(None, 'custom_fields', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(None, 'custom_fields', 'groups', ['group_id'], ['id'], ondelete='CASCADE')

    # Drop old columns
    op.drop_column('custom_fields', 'extra_data')
    op.drop_column('custom_fields', 'type')

    print("  ✓ custom_fields migration complete")

    # ========================================
    # STEP 3: ADD JSONB COLUMN
    # ========================================

    print("Step 3: Adding JSONB column...")

    op.add_column('custom_field_values',
                  sa.Column('value', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('custom_field_values',
                  sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))

    # ========================================
    # STEP 4: DATA MIGRATION
    # ========================================

    print("Step 4: Migrating custom field values...")

    result = connection.execute(text("""
        SELECT
            cfv.id, cfv.value_text, cfv.value_int, cfv.value_float,
            cfv.value_date, cfv.value_boolean, cfv.value_monetary,
            cfv.value_yearmonth, cf.type_handler
        FROM custom_field_values cfv
        JOIN custom_fields cf ON cf.id = cfv.field_id
    """))

    migrated_count = 0
    for row in result:
        cfv_id, v_text, v_int, v_float, v_date, v_bool, v_mon, v_ym, type_h = row

        raw_value = None
        sortable = None

        if type_h == 'text':
            raw_value = v_text
            sortable = v_text.lower() if v_text else None
        elif type_h == 'integer':
            raw_value = v_int
            sortable = str(v_int) if v_int is not None else None
        elif type_h == 'number':
            raw_value = float(v_float) if v_float is not None else None
            sortable = str(v_float) if v_float is not None else None
        elif type_h == 'date':
            if v_date:
                raw_value = v_date.strftime('%Y-%m-%d') if hasattr(v_date, 'strftime') else str(v_date)[:10]
                sortable = raw_value
        elif type_h == 'boolean':
            raw_value = v_bool
            sortable = "1" if v_bool else "0"
        elif type_h == 'monetary':
            if v_mon is not None:
                raw_value = float(v_mon)
                sortable = str(v_mon)
        elif type_h == 'yearmonth':
            if v_ym is not None:
                year = int(v_ym)
                month = int(round((v_ym - year) * 100))
                raw_value = f"{year:04d}-{month:02d}"
                sortable = raw_value

        if raw_value is not None:
            jsonb = json.dumps({"raw": raw_value, "sortable": sortable, "metadata": {}})
            connection.execute(
                text("UPDATE custom_field_values SET value = :v WHERE id = :id"),
                {"v": jsonb, "id": str(cfv_id)}
            )
            migrated_count += 1
        else:
            connection.execute(
                text("UPDATE custom_field_values SET value = '{}' WHERE id = :id"),
                {"id": str(cfv_id)}
            )

    print(f"  ✓ Migrated {migrated_count} values")

    op.alter_column('custom_field_values', 'value', nullable=False)

    # ========================================
    # STEP 5: DROP OLD & ADD COMPUTED COLUMNS
    # ========================================

    print("Step 5: Adding computed columns...")

    # Drop old columns
    op.drop_column('custom_field_values', 'value_text')
    op.drop_column('custom_field_values', 'value_date')
    op.drop_column('custom_field_values', 'value_yearmonth')
    op.drop_column('custom_field_values', 'value_int')
    op.drop_column('custom_field_values', 'value_monetary')
    op.drop_column('custom_field_values', 'value_float')
    op.drop_column('custom_field_values', 'value_boolean')

    # Add computed columns using helper functions
    op.add_column('custom_field_values',
                  sa.Column('value_text', sa.Text(),
                            sa.Computed("(value->>'sortable')"),
                            nullable=True))

    op.add_column('custom_field_values',
                  sa.Column('value_numeric', sa.Numeric(precision=20, scale=6),
                            sa.Computed("""
                      CASE
                          WHEN jsonb_typeof(value->'raw') = 'number'
                          THEN (value->>'raw')::NUMERIC
                          ELSE NULL
                      END
                  """),
                            nullable=True))

    # Use helper functions for date/datetime
    op.add_column('custom_field_values',
                  sa.Column('value_date', sa.Date(),
                            sa.Computed("jsonb_text_to_date(value->'raw')"),
                            nullable=True))

    op.add_column('custom_field_values',
                  sa.Column('value_datetime', sa.DateTime(),
                            sa.Computed("jsonb_text_to_timestamp(value->'raw')"),
                            nullable=True))

    op.add_column('custom_field_values',
                  sa.Column('value_boolean', sa.Boolean(),
                            sa.Computed("""
                      CASE
                          WHEN jsonb_typeof(value->'raw') = 'boolean'
                          THEN (value->>'raw')::BOOLEAN
                          ELSE NULL
                      END
                  """),
                            nullable=True))

    op.alter_column('custom_field_values', 'created_at',
                    existing_type=postgresql.TIMESTAMP(),
                    type_=sa.DateTime(timezone=True),
                    existing_nullable=False)

    # ========================================
    # STEP 6: CREATE INDEXES
    # ========================================

    print("Step 6: Creating indexes...")

    op.create_index('idx_cfv_doc', 'custom_field_values', ['document_id'], unique=False)
    op.create_index('idx_cfv_field_text', 'custom_field_values', ['field_id', 'value_text'], unique=False)
    op.create_index('idx_cfv_field_numeric', 'custom_field_values', ['field_id', 'value_numeric'], unique=False)
    op.create_index('idx_cfv_field_date', 'custom_field_values', ['field_id', 'value_date'], unique=False)
    op.create_index('idx_cfv_field_datetime', 'custom_field_values', ['field_id', 'value_datetime'], unique=False)
    op.create_index('idx_cfv_field_boolean', 'custom_field_values', ['field_id', 'value_boolean'], unique=False)
    op.create_index('idx_cfv_unique_doc_field', 'custom_field_values', ['document_id', 'field_id'], unique=True)

    op.drop_constraint('custom_field_values_field_id_fkey', 'custom_field_values', type_='foreignkey')
    op.create_foreign_key(None, 'custom_field_values', 'custom_fields', ['field_id'], ['id'], ondelete='CASCADE')

    print("✓ Migration complete!")


def downgrade() -> None:
    """
    WARNING: Downgrade will lose data stored in new JSONB format!
    """

    print("WARNING: Downgrading will result in data loss!")

    connection = op.get_bind()

    # ========================================
    # CUSTOM_FIELDS TABLE DOWNGRADE
    # ========================================

    print("Downgrading custom_fields table...")

    # Add old columns back
    op.add_column('custom_fields',
        sa.Column('type', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('custom_fields',
        sa.Column('extra_data', sa.VARCHAR(), autoincrement=False, nullable=True))

    # Migrate type_handler -> type
    type_reverse_mapping = {
        'text': 'text',
        'integer': 'int',
        'number': 'float',
        'date': 'date',
        'boolean': 'boolean',
        'monetary': 'monetary',
        'yearmonth': 'yearmonth',
    }

    for new_handler, old_type in type_reverse_mapping.items():
        connection.execute(
            text("UPDATE custom_fields SET type = :old_type WHERE type_handler = :new_handler"),
            {"old_type": old_type, "new_handler": new_handler}
        )

    # Migrate config -> extra_data
    result = connection.execute(
        text("SELECT id, config FROM custom_fields WHERE config IS NOT NULL AND config::text != '{}'")
    )

    for row in result:
        field_id = row[0]
        config = row[1]

        extra_data_str = json.dumps(config) if isinstance(config, dict) else str(config)
        connection.execute(
            text("UPDATE custom_fields SET extra_data = :extra_data WHERE id = :id"),
            {"extra_data": extra_data_str, "id": str(field_id)}
        )

    # Make type NOT NULL
    op.alter_column('custom_fields', 'type', nullable=False)

    # Restore old foreign keys
    op.drop_constraint(None, 'custom_fields', type_='foreignkey')
    op.drop_constraint(None, 'custom_fields', type_='foreignkey')
    op.create_foreign_key('custom_fields_user_id_fkey', 'custom_fields', 'users', ['user_id'], ['id'])
    op.create_foreign_key('custom_fields_group_id_fkey', 'custom_fields', 'groups', ['group_id'], ['id'])

    # Drop indexes
    op.drop_index(op.f('ix_custom_fields_user_id'), table_name='custom_fields')
    op.drop_index(op.f('ix_custom_fields_group_id'), table_name='custom_fields')
    op.drop_index('idx_custom_fields_type', table_name='custom_fields')
    op.drop_index('idx_custom_fields_name', table_name='custom_fields')

    # Drop new columns
    op.drop_column('custom_fields', 'config')
    op.drop_column('custom_fields', 'type_handler')

    # ========================================
    # CUSTOM_FIELD_VALUES TABLE DOWNGRADE
    # ========================================

    print("Downgrading custom_field_values table...")

    # Add old columns back BEFORE dropping computed columns
    op.add_column('custom_field_values',
        sa.Column('value_text', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('custom_field_values',
        sa.Column('value_date', postgresql.TIMESTAMP(), autoincrement=False, nullable=True))
    op.add_column('custom_field_values',
        sa.Column('value_float', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('custom_field_values',
        sa.Column('value_monetary', sa.NUMERIC(), autoincrement=False, nullable=True))
    op.add_column('custom_field_values',
        sa.Column('value_int', sa.INTEGER(), autoincrement=False, nullable=True))
    op.add_column('custom_field_values',
        sa.Column('value_yearmonth', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))

    # Migrate JSONB back to typed columns
    print("  Migrating JSONB back to typed columns...")

    result = connection.execute(text("""
        SELECT
            cfv.id,
            cfv.value,
            cf.type_handler
        FROM custom_field_values cfv
        JOIN custom_fields cf ON cf.id = cfv.field_id
        WHERE cfv.value IS NOT NULL
    """))

    for row in result:
        cfv_id = row[0]
        value_jsonb = row[1]
        type_handler = row[2]

        if not value_jsonb or value_jsonb == {}:
            continue

        try:
            raw_value = value_jsonb.get('raw')

            if raw_value is None:
                continue

            if type_handler == 'text':
                connection.execute(
                    text("UPDATE custom_field_values SET value_text = :val WHERE id = :id"),
                    {"val": str(raw_value), "id": str(cfv_id)}
                )

            elif type_handler == 'integer':
                connection.execute(
                    text("UPDATE custom_field_values SET value_int = :val WHERE id = :id"),
                    {"val": int(raw_value), "id": str(cfv_id)}
                )

            elif type_handler == 'number':
                connection.execute(
                    text("UPDATE custom_field_values SET value_float = :val WHERE id = :id"),
                    {"val": float(raw_value), "id": str(cfv_id)}
                )

            elif type_handler == 'date':
                connection.execute(
                    text("UPDATE custom_field_values SET value_date = :val WHERE id = :id"),
                    {"val": str(raw_value), "id": str(cfv_id)}
                )

            elif type_handler == 'boolean':
                connection.execute(
                    text("UPDATE custom_field_values SET value_boolean = :val WHERE id = :id"),
                    {"val": bool(raw_value), "id": str(cfv_id)}
                )

            elif type_handler == 'monetary':
                connection.execute(
                    text("UPDATE custom_field_values SET value_monetary = :val WHERE id = :id"),
                    {"val": float(raw_value), "id": str(cfv_id)}
                )

            elif type_handler == 'yearmonth':
                if '-' in str(raw_value):
                    parts = str(raw_value).split('-')
                    year = int(parts[0])
                    month = int(parts[1])
                    float_val = year + month / 100.0
                    connection.execute(
                        text("UPDATE custom_field_values SET value_yearmonth = :val WHERE id = :id"),
                        {"val": float_val, "id": str(cfv_id)}
                    )

        except Exception as e:
            print(f"    Error downgrading value {cfv_id}: {e}")

    # Drop computed columns
    op.drop_column('custom_field_values', 'value_boolean')
    op.drop_column('custom_field_values', 'value_datetime')
    op.drop_column('custom_field_values', 'value_numeric')
    op.drop_column('custom_field_values', 'value_date')
    op.drop_column('custom_field_values', 'value_text')

    # Restore old foreign key
    op.drop_constraint(None, 'custom_field_values', type_='foreignkey')
    op.create_foreign_key('custom_field_values_field_id_fkey', 'custom_field_values', 'custom_fields', ['field_id'], ['id'])

    # Drop indexes
    op.drop_index('idx_cfv_unique_doc_field', table_name='custom_field_values')
    op.drop_index('idx_cfv_field_boolean', table_name='custom_field_values')
    op.drop_index('idx_cfv_field_datetime', table_name='custom_field_values')
    op.drop_index('idx_cfv_field_date', table_name='custom_field_values')
    op.drop_index('idx_cfv_field_numeric', table_name='custom_field_values')
    op.drop_index('idx_cfv_field_text', table_name='custom_field_values')
    op.drop_index('idx_cfv_doc', table_name='custom_field_values')

    # Restore old column types
    op.alter_column('custom_field_values', 'created_at',
                    existing_type=sa.DateTime(timezone=True),
                    type_=postgresql.TIMESTAMP(),
                    existing_nullable=False)

    # Drop new columns
    op.drop_column('custom_field_values', 'updated_at')
    op.drop_column('custom_field_values', 'value')

    print("Dropping helper functions...")
    connection.execute(text("DROP FUNCTION IF EXISTS jsonb_text_to_date(jsonb);"))
    connection.execute(text("DROP FUNCTION IF EXISTS jsonb_text_to_timestamp(jsonb);"))

    print("✓ Downgrade complete")
