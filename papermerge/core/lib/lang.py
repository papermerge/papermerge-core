from configula import Configula

"""
Tesseract uses ISO-639-2/T for language names
 key is ISO-639-2/T as per:
 https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
"""

# We can't read configuration from django settings here, because API from this
# module i.e. ``get_ocr_langs`` and ``get_default_ocr_lang`` is used in
# dynamic_preferences_registry.py. The latter is parsed/invoked BEFORE django
# settings fills in langs with configula.
config = Configula()


def get_default_ocr_lang():
    """
    Returns default OCR language

    Pulls information by directly using Configula interface (as
    opposite to accessing settings.PAPERMERGE_OCR_DEFAULT_LANGUAGE
    """
    return config.get(
        'ocr',
        'default_language',
        default='deu'
    )


def get_ocr_langs(capitalize=True):
    """
    Returns a list of tuples as required by
    Django's choices ((key, value),(key, value), ...)

    Pulls information by directly using Configula interface (as
    opposite to accessing settings.PAPERMERGE_OCR_LANGUAGES
    """
    lang_dict = config.get(
        'ocr',
        'languages',
        default={
            'deu': 'Deutsch',
            'eng': 'English',
        }
    )

    return [
        (key, value.capitalize())
        for key, value in lang_dict.items()
    ]
