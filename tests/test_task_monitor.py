from django.test import TestCase
from papermerge.core.task_monitor.task import Task


class TestTasks(TestCase):

    def test_basic_task_creation(self):
        task1 = Task(name="hello")
        self.assertEquals(task1.name, "hello")

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

