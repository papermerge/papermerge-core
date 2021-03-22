
class Task:

    def __init__(self, name, attrs=[], **kwargs):
        self.name = name
        self.state = None
        self.attrs = attrs
        self.kwargs = kwargs

    def __eq__(self, name):
        return self.name == name

    def to_dict(self):
        pass
