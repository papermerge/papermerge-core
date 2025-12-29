from .registry import TypeRegistry
from .text import TextTypeHandler


@TypeRegistry.register
class ShortTextTypeHandler(TextTypeHandler):

    @property
    def type_id(self) -> str:
        return "short_text"
