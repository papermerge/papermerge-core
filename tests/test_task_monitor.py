from unittest.mock import Mock

from django.test import TestCase
from papermerge.core.task_monitor.task import (
    Task,
    dict2channel_data
)
from papermerge.core.task_monitor.store import GenericStore
from papermerge.core.task_monitor.monitor import Monitor


class TestTasks(TestCase):

    def test_basic_task_creation(self):
        task1 = Task(name="hello")
        self.assertEqual(task1.name, "hello")
        self.assertEqual(task1.short_name, "hello")
        self.assertEqual(task1.full_name, "hello")

        task2 = Task(name="papermerge.core.tasks.ocr_page")
        self.assertEqual(
            task2.short_name, "ocr_page"
        )
        self.assertEqual(
            task2.name, "papermerge.core.tasks.ocr_page"
        )
        self.assertEqual(
            task2.full_name, "papermerge.core.tasks.ocr_page"
        )

    def test_task_with_kwargs(self):
        task1 = Task(
            name="papermerge.core.tasks.ocr_page",
            document_id='',
            page_num='',
            user_id=''
        )

        self.assertEqual(
            task1['document_id'],
            ''
        )

        task2 = Task(
            name="papermerge.core.tasks.ocr_page",
            document_id='1',
            page_num='',
            user_id=''
        )

        self.assertEqual(
            task2['document_id'],
            '1'
        )
        self.assertEqual(
            task1,
            task2
        )

    def test_task_str(self):
        task = Task("xtask", document_id=1)

        self.assertEqual(
            str(task),
            "Task({'task_name': 'xtask', 'document_id': 1})"
        )

    def test_task_update(self):
        """
        A task can be updated in standard way i.e. as
        standard python dictionary or via jons formated string
        """
        task = Task(
            name="papermerge.core.tasks.xtask",
            document_id=''
        )
        task.update(document_id=3)

        self.assertEqual(
            task['document_id'],
            3
        )

        task.update('{"document_id": 10}')
        self.assertEqual(
            task['document_id'],
            10
        )

    def test_task_name_can_be_None(self):
        """
        Task can have name == None
        """
        task = Task(name=None)
        self.assertIsNone(task.name)

    def test_converting_task_will_return_its_attributes_and_name(self):
        """
        Converting task to dictionary (with dict(task)) will return 'task_name'
        attribute as well
        """
        task = Task(
            "papermerge.core.tasks.ytask",
            document_id=44,
            user_id=32
        )

        self.assertEqual(
            dict(task),
            {
                'document_id': 44,
                'user_id': 32,
                'task_name': 'papermerge.core.tasks.ytask'
            }
        )

    def test_dict2channel_data(self):
        task = Task(
            "papermerge.core.tasks.ocr_page",
            document_id=44,
            user_id=32,
            type='task-received'
        )

        channel_dict = {
            'type': 'ocrpage.taskreceived',
            'document_id': 44,
            'user_id': 32
        }

        group_name, ret_channel_dict = dict2channel_data(dict(task))

        self.assertDictEqual(
            ret_channel_dict,
            channel_dict
        )

        self.assertEqual(
            group_name,
            "ocr_page"
        )

class TestTaskMonitor(TestCase):

    def setUp(self):
        self.callback = Mock()
        store = GenericStore()
        self.monitor = Monitor(
            prefix="testing-task-monitor",
            store=store
        )
        self.monitor.set_callback(self.callback)

    def test_is_task_monitored(self):

        self.monitor.add_task(
            Task(
                "papermerge.core.tasks.ocr_page",
                document_id='',
                user_id=''
            )
        )

        self.assertTrue(
            self.monitor.is_monitored_task("papermerge.core.tasks.ocr_page")
        )

    def test_callback_is_invoked(self):

        task = Task(
            "papermerge.core.tasks.ocr_page",
            document_id='',
            user_id=''
        )
        self.monitor.add_task(task)

        event = {
            'uuid': 'long-long-long-id',
            'type': 'task-received',
            'name': 'papermerge.core.tasks.ocr_page',
            'kwargs': "{'document_id': 33, 'user_id': 13}"
        }

        self.monitor.save_event(event)
        self.callback.assert_called_with(
            dict(task)
        )

    def test_events_which_are_not_monitored_will_be_ignored(self):

        task = Task(
            "papermerge.core.tasks.ocr_page",
            document_id='',
            user_id=''
        )
        self.monitor.add_task(task)

        # notice that papermerge.core.tasks.cut_pages IS NOT monitored
        event = {
            'uuid': 'long-long-long-id',
            'type': 'task-received',
            'name': 'papermerge.core.tasks.cut_pages',
            'kwargs': "{'document_id': 33, 'user_id': 13}"
        }

        self.monitor.save_event(event)
        self.callback.assert_not_called()

    def test_realistic_event_sequence1(self):
        """
        Events triggered by tasks which are monitored
        must invoke monitor.callback with correct arguments
        """
        task = Task(
            "papermerge.core.tasks.ocr_page",
            document_id='',
            user_id=''
        )
        self.monitor.add_task(task)

        self.monitor.save_event({
            'uuid': 'abcd-1',
            'type': 'task-received',
            'name': 'papermerge.core.tasks.ocr_page',
            'kwargs': "{'document_id': 33, 'user_id': 13}"
        })

        self.callback.assert_called_with({
            'type': 'task-received',
            'task_name': 'papermerge.core.tasks.ocr_page',
            'document_id': 33,
            'user_id': 13
        })

        self.monitor.save_event({
            'uuid': 'abcd-1',
            'type': 'task-started',
        })

        self.callback.assert_called_with({
            'type': 'task-started',
            'task_name': 'papermerge.core.tasks.ocr_page',
            'document_id': 33,
            'user_id': 13
        })

        self.monitor.save_event({
            'uuid': 'abcd-1',
            'type': 'task-succeeded',
        })

        self.callback.assert_called_with({
            'type': 'task-succeeded',
            'task_name': 'papermerge.core.tasks.ocr_page',
            'document_id': 33,
            'user_id': 13
        })

    def test_realistic_event_sequence2(self):
        """
        Events triggered by tasks which are not monitored
        should not invoke monitor.callback
        """
        task = Task(
            "papermerge.core.tasks.ocr_page",
            document_id='',
            user_id=''
        )
        self.monitor.add_task(task)

        # sequence of events for a task which is
        # not monitored
        self.monitor.save_event({
            'uuid': 'xyz-1-not-mon',
            'type': 'task-received',
            'name': 'papermerge.core.tasks.cut_pages',
            'kwargs': "{'document_id': 4}"
        })

        self.callback.assert_not_called()

        self.monitor.save_event({
            'uuid': 'xyz-1-not-mon',
            'type': 'task-started',
        })

        self.callback.assert_not_called()

        self.monitor.save_event({
            'uuid': 'xyz-1-not-mon',
            'type': 'task-succeeded',
        })

        self.callback.assert_not_called()
