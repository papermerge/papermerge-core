from .text import TextTypeHandler


class ShortTextTypeHandler(TextTypeHandler):

    @property
    def type_id(self) -> str:
        return "short_text"
