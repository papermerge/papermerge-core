from datetime import datetime, timezone


def utc_now():
    """Returns current time in UTC - always use for database timestamps"""
    return datetime.now(timezone.utc)
