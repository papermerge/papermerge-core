
class Field:
    def __init__(self, primary_key=False, default=None):
        self.primary_key = primary_key
        self.default = default


class KeywordField(Field):
    pass


class TextField(Field):
    pass


class NumericField(Field):
    pass


class IdField(Field):
    pass
