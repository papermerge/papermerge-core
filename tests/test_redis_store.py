from django.test import TestCase

from papermerge.core.task_monitor.store import RedisStore
from papermerge.core.app_settings import settings


class TestRedisStore(TestCase):

    def setUp(self):
        self.store = RedisStore(
            url=settings.TASK_MONITOR_STORE_URL,
            timeout=20
        )

    def tearDown(self):
        self.store.flushdb()

    def test_redis_store_dict_serialization(self):
        """
        Assert that it is possible to serialize into redis store
        a dictionary object which contains other dictionaries as values.
        """
        obj = {
            'color': 'green',
            'attributes': {
                'shape': 'circle',
                'size': 1
            }
        }
        self.store['alien'] = obj

        retrieved_obj = self.store['alien']
        self.assertDictEqual(retrieved_obj, obj)

    def test_simple_object_serialization(self):
        self.store['color'] = 'green'
        self.assertEqual(
            self.store['color'], 'green'
        )
        self.assertEqual(
            self.store.get('color', False), 'green'
        )
        self.assertFalse(self.store.get('shape', False))
