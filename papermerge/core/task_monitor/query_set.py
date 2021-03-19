

class QuerySet:
    """
    Represent a lazy database/store/redis lookup for a set of tasks
    """

    def __init__(self, task_name):
        self._task_name = task_name

    def find(self, **kwargs):
        pass

    def count(self):
        pass

    def active(self):
        pass
