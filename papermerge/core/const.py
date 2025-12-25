import uuid

"""
System user is special user who own resources created by background tasks
and initialization scripts
"""
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")
SYSTEM_USER_USERNAME = "system"
