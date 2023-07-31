from pydantic import BaseModel, ConfigDict, model_serializer

from .field import Field


class Schema(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    @model_serializer()
    def model_ser(self):
        result = {}
        for name, field in self.model_fields.items():
            default_value = getattr(self, name)
            if isinstance(default_value, Field):
                result[name] = field.default.default
            else:
                result[name] = default_value

        return result
