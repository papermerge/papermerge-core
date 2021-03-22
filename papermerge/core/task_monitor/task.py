
class Task:

    def __init__(self, name, attrs=[], **kwargs):
        self.name = name
        self.attrs = attrs
        self.kwargs = kwargs

    def __eq__(self, name):
        return self.name == name

    @property
    def state(self):
        kwargs = self.kwargs or {}
        return kwargs.get('state', None)

    def to_dict(self):
        ret = {}
        ret['name'] = self.name
        ret['state'] = self.state
        ret.update(self.kwargs or {})

        return ret
