from django.utils.html import escape


def sanitize_kvstore(kvstore_dict):
    """
    Creates a sanitized dictionary.

    Sanitizied dictionary contains only allowed keys and escaped values.
    """
    allowed_keys = [
        'id',
        'key',
        'value',
        'kv_type',
        'kv_format',
        'kv_inherited',
    ]

    sanitized_kvstore_dict = {}

    for allowed_key in allowed_keys:
        if allowed_key in kvstore_dict.keys():
            value = kvstore_dict.get(allowed_key, None)
            if isinstance(value, bool):
                allowed_value = value
            else:
                allowed_value = escape(kvstore_dict.get(allowed_key, None))

            sanitized_kvstore_dict[allowed_key] = allowed_value

    return sanitized_kvstore_dict


def sanitize_kvstore_list(kvstore_list):
    """
    Creates a new list of sanitized dictionaries.

    Sanitizied dictionary contains only allowed keys and escaped values.
    """
    if not isinstance(kvstore_list, list):
        raise ValueError("Expects list type as input")

    new_kvstore_list = [
        sanitize_kvstore(item) for item in kvstore_list
    ]

    return new_kvstore_list
