import json


class Task(dict):
    """
    A task (in context of task monitor) instance
    is basically a named dictionary with a few extras.

    Two tasks are considered equal if their names
    matches.
    """

    def __init__(self, name, **kwargs):
        self.name = name
        self['task_name'] = name
        super().__init__(**kwargs)

    def __eq__(self, name):
        """
        Two tasks are considered equal if their names
        matches.
        """
        return self.name == name

    def __str__(self):
        key_values = super().__str__()
        return f"Task({key_values})"

    def update(self, json_str=None, **kwargs):
        """
        Tasks' key values can be updated either from
        json formatted string or from
        key/values passed by **kwargs (as for an usual python dictionary)
        """
        if not json_str:
            super().update(**kwargs)
            return self

        # json formated string of length == 2
        # is basically an empty dictionary i.e. '{}'
        if len(json_str) <= 2:
            return self

        data = json.loads(json_str.replace("'", '"'))

        super().update(data)
        return self

    @property
    def short_name(self):
        return self.name.split('.')[-1]

    @property
    def full_name(self):
        return self.name


def dict2channel_data(task_dict):
    """
    Transforms a task dictionary i.e. a dictionary returned
    by dict(task) for sending to django channel.

    will take original ``task_name`` and ``type`` keys and create
    new ``type`` key with format <shortname>.<type with removed dashes>
    """

    ret_dict = {}
    orig_type = task_dict.pop('type')
    orig_task_name = task_dict.pop('task_name')

    short_name = orig_task_name.split('.')[-1]
    short_name = short_name.replace('_', '')
    _type = orig_type.replace('-', '')
    new_type = f"{short_name}.{_type}"

    ret_dict['type'] = new_type
    ret_dict.update(task_dict)

    return ret_dict
