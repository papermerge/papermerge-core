from django.db import models

from papermerge.core.features.document_types.models import DocumentType

from .custom_field import CustomField


class DocumentTypeCustomField(models.Model):
    document_type = models.ForeignKey(
        on_delete=models.CASCADE,
        related_name="custom_fields",
        to=DocumentType,
    )
    custom_field = models.ForeignKey(
        on_delete=models.CASCADE, related_name="document_types", to=CustomField
    )

    class Meta:
        db_table = "document_type_custom_field"
