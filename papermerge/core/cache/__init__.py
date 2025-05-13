from papermerge.core import config
from .empty import Client as EmptyClient
from .redis_client import Client as RedisClient

settings = config.get_settings()

redis_url = settings.papermerge__redis__url
cache_enabled = settings.papermerge__main__cache_enabled

if redis_url and cache_enabled:
    client = RedisClient(redis_url)
else:
    client = EmptyClient()
