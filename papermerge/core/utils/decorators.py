from django.conf import settings


def skip_in_tests(orig_func):
    def inner(*args):
        # invoke original function only if code is NOT in testing mode
        if not settings.TESTING:
            orig_func(*args)

    return inner