import uuid

from django.db import models
from django.utils import timezone


class DocumentType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=128)
    user = models.ForeignKey(
        "User", related_name="document_types", on_delete=models.CASCADE
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
        return f"{self.name}"
