from django.test import TestCase
from papermerge.core.task_monitor.task import Task


class TestTasks(TestCase):

    def test_basic_task_creation(self):
        task1 = Task(name="hello")
        self.assertEquals(task1.name, "hello")
        self.assertEquals(task1.short_name, "hello")
        self.assertEquals(task1.full_name, "hello")

        task2 = Task(name="papermerge.core.tasks.ocr_page")
        self.assertEquals(
            task2.short_name, "ocr_page"
        )
        self.assertEquals(
            task2.name, "papermerge.core.tasks.ocr_page"
        )
        self.assertEquals(
            task2.full_name, "papermerge.core.tasks.ocr_page"
        )

    def test_task_with_kwargs(self):
        task1 = Task(
            name="papermerge.core.tasks.ocr_page",
            document_id='',
            page_num='',
            user_id=''
        )

        self.assertEquals(
            task1['document_id'],
            ''
        )

        task2 = Task(
            name="papermerge.core.tasks.ocr_page",
            document_id='1',
            page_num='',
            user_id=''
        )

        self.assertEquals(
            task2['document_id'],
            '1'
        )
        self.assertEquals(
            task1,
            task2
        )

    def test_task_str(self):
        task = Task(name="xtask", document_id=1)

        self.assertEquals(
            str(task),
            "Task(name=xtask, {'document_id': 1})"
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

        self.assertEquals(
            task['document_id'],
            3
        )

        task.update('{"document_id": 10}')
        self.assertEquals(
            task['document_id'],
            10
        )

    def test_task_name_can_be_None(self):
        """
        Task can have name == None
        """
        task = Task(name=None)
        self.assertIsNone(task.name)
