import uuid

from django.db import models
from django.utils import timezone

from .document import Document


class CustomField(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    name = models.CharField(max_length=128)
    type = models.CharField(max_length=50)

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
        db_table = "custom_fields"
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                name="%(app_label)s_%(class)s_unique_name",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} : {self.type}"


class CustomFieldValue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

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
    value_int = models.IntegerField(null=True)
    value_date = models.DateField(null=True)
    value_boolean = models.BooleanField(null=True)
    value_float = models.FloatField(null=True)
    value_monetary = models.DecimalField(null=True, max_digits=36, decimal_places=2)

    created_at = models.DateTimeField(
        "created_at",
        default=timezone.now,
        db_index=True,
        editable=False,
    )

    class Meta:
        ordering = ("created_at",)
        db_table = "custom_field_values"
        constraints = [
            models.UniqueConstraint(
                fields=["document", "field"],
                name="%(app_label)s_%(class)s_unique_document_field",
            ),
        ]
