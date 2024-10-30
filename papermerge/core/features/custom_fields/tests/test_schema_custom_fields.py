import json
import uuid

from papermerge.core.features.custom_fields.schema import CustomField, CustomFieldType


def test_custom_field_extra_data_as_str():
    data = {"currency": "EUR"}
    cf = CustomField(
        id=uuid.uuid4(),
        name="coco",
        type=CustomFieldType.monetary,
        extra_data=json.dumps(data),
    )

    assert cf


def test_custom_field_extra_data_as_dict():
    data = {"currency": "EUR"}
    cf = CustomField(
        id=uuid.uuid4(),
        name="coco",
        type=CustomFieldType.monetary,
        extra_data=data,
    )

    assert cf
