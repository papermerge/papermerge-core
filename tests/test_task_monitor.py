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

        self.assertDictEqual(
            dict2channel_data(dict(task)),
            channel_dict
        )


class TestTaskMonitor(TestCase):

    def setUp(self):
        store = GenericStore()
        self.monitor = Monitor(
            prefix="testing-task-monitor",
            store=store
        )

    def test_is_task_monitored(self):
        pass
