import asyncio


def async_command(async_func):
    """Decorator to make async functions work with typer"""
    from functools import wraps

    @wraps(async_func)
    def wrapper(*args, **kwargs):
        return asyncio.run(async_func(*args, **kwargs))

    return wrapper
