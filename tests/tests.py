from django.test import TestCase
from papermerge.core.task_monitor.task import Task


class TestTasks(TestCase):

    def test_basic_task_creation(self):
        task = Task(name="hello")
        self.assertEquals(task.name, "hello")
