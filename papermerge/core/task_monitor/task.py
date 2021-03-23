
class Task(dict):

    def __init__(self, name, **kwargs):
        self.name = name
        self.kwargs = dict(**kwargs)

    def __eq__(self, name):
        return self.name == name

    @property
    def short_name(self):
        return self.name.split('.')[-1]

    @property
    def full_name(self):
        return self.name

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
