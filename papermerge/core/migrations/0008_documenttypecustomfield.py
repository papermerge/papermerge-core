# Generated by Django 4.2.13 on 2024-10-02 05:00

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0007_alter_customfieldvalue_document_documenttype_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="DocumentTypeCustomField",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "custom_field",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="document_types",
                        to="core.customfield",
                    ),
                ),
                (
                    "document_type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="custom_fields",
                        to="core.documenttype",
                    ),
                ),
            ],
        ),
    ]