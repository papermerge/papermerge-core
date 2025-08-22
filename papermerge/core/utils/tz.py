from datetime import datetime
from zoneinfo import ZoneInfo

from papermerge.core import config

settings = config.get_settings()


def tz_aware_datetime_now():
    tz = settings.papermerge__main__timezone
    zone = ZoneInfo(tz)
    return datetime.now(zone)
