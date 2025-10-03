from typing import List

from .schema import SelectOption


def get_ui_languages() -> List[SelectOption]:
    """
    https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
    """
    return [
        SelectOption(label='Deutsch', value='de'),
        SelectOption(label='English', value='en'),
        SelectOption(label='Қазақша', value='kk'),
        SelectOption(label='Русский', value='ru'),
    ]
