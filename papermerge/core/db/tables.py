from sqlalchemy import (Boolean, Column, DateTime, MetaData, String, Table,
                        Uuid, func)

metadata_obj = MetaData()

users_table = Table(
    "core_user",
    metadata_obj,
    Column("id", Uuid, primary_key=True),
    Column("username", String(150), nullable=False),
    Column("email", String(254), nullable=False),
    Column("first_name", String(150), nullable=False),
    Column("last_name", String(150), nullable=False),
    Column("is_superuser", Boolean, nullable=False, default=False),
    Column("is_staff", Boolean, nullable=False, default=False),
    Column("is_active", Boolean, nullable=False, default=True),
    Column("last_login", DateTime, nullable=True),
    Column(
        "created_at",
        DateTime,
        nullable=False,
        default=func.current_timestamp()
    ),
    Column(
        "updated_at",
        DateTime,
        nullable=False,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    ),
    Column(
        "home_folder_id",
        Uuid,
        nullable=True
    ),
    Column(
        "inbox_folder_id",
        Uuid,
        nullable=True
    )
 )
