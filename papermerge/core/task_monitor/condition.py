
class Condition:

    def __init__(self, name, attrs=[]):
        self.name = name
        self.attrs = attrs

    def __eq__(self, name):
        return self.name == name
