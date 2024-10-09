import uuid

from django.db import models
from django.utils import timezone

from .document import Document


class CustomField(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    class FieldDataType(models.TextChoices):
        STRING = ("string", "String")
        URL = ("url", "URL")
        DATE = ("date", "Date")
        BOOL = ("boolean", "Boolean")
        INT = ("integer", "Integer")
        FLOAT = ("float", "Float")
        MONETARY = ("monetary", "Monetary")
        DOCUMENTLINK = ("documentlink", "Document Link")
        SELECT = ("select", "Select")

    name = models.CharField(max_length=128)

    data_type = models.CharField(
        "data type",
        max_length=50,
        choices=FieldDataType.choices,
        editable=False,
    )

    extra_data = models.JSONField(
        "extra data",
        null=True,
        blank=True,
        help_text="Extra data for the custom field, such as select options",
    )

    user = models.ForeignKey(
        "User", related_name="custom_fields", on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(
        "created_at",
        default=timezone.now,
        db_index=True,
        editable=False,
    )

    class Meta:
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                name="%(app_label)s_%(class)s_unique_name",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} : {self.data_type}"


class CustomFieldValue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    TYPE_TO_DATA_STORE_NAME_MAP = {
        CustomField.FieldDataType.STRING: "value_text",
        CustomField.FieldDataType.URL: "value_url",
        CustomField.FieldDataType.DATE: "value_date",
        CustomField.FieldDataType.BOOL: "value_bool",
        CustomField.FieldDataType.INT: "value_int",
        CustomField.FieldDataType.FLOAT: "value_float",
        CustomField.FieldDataType.MONETARY: "value_monetary",
        CustomField.FieldDataType.DOCUMENTLINK: "value_document_ids",
        CustomField.FieldDataType.SELECT: "value_select",
    }
    document = models.ForeignKey(
        Document,
        blank=False,
        null=False,
        on_delete=models.CASCADE,
        editable=False,
    )

    field = models.ForeignKey(
        CustomField,
        blank=False,
        null=False,
        on_delete=models.CASCADE,
        related_name="fields",
        editable=False,
    )

    # Actual data storage
    value_text = models.CharField(max_length=128, null=True)

    value_bool = models.BooleanField(null=True)

    value_url = models.URLField(null=True)

    value_date = models.DateField(null=True)

    value_int = models.IntegerField(null=True)

    value_float = models.FloatField(null=True)

    value_monetary = models.DecimalField(null=True, max_digits=36, decimal_places=2)

    value_document_ids = models.JSONField(null=True)

    value_select = models.PositiveSmallIntegerField(null=True)

    created_at = models.DateTimeField(
        "created_at",
        default=timezone.now,
        db_index=True,
        editable=False,
    )

    class Meta:
        ordering = ("created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["document", "field"],
                name="%(app_label)s_%(class)s_unique_document_field",
            ),
        ]

    def __str__(self) -> str:
        value = (
            self.field.extra_data["select_options"][self.value_select]
            if (
                self.field.data_type == CustomField.FieldDataType.SELECT
                and self.value_select is not None
            )
            else self.value
        )
        return str(self.field.name) + f" : {value}"

    @classmethod
    def get_value_field_name(cls, data_type: CustomField.FieldDataType):
        try:
            return cls.TYPE_TO_DATA_STORE_NAME_MAP[data_type]
        except KeyError:  # pragma: no cover
            raise NotImplementedError(data_type)

    @property
    def value(self):
        """
        Based on the data type, access the actual value the instance stores
        A little shorthand/quick way to get what is actually here
        """
        value_field_name = self.get_value_field_name(self.field.data_type)
        return getattr(self, value_field_name)
