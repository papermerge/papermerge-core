import os


def skip_in_tests(orig_func):
    def inner(*args, **kwargs):
        if os.environ.get("PAPERMERGE__REDIS__URL", False):
            breakpoint()
            orig_func(*args, **kwargs)

    return inner


def docstring_parameter(**kwargs):
    def dec(obj):
        obj.__doc__ = obj.__doc__.format(**kwargs)
        return obj

    return dec
