# Generated by Django 4.2.13 on 2024-09-30 13:40

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_customfield_customfieldinstance_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="customfield",
            name="id",
            field=models.UUIDField(
                default=uuid.uuid4, primary_key=True, serialize=False
            ),
        ),
        migrations.AlterField(
            model_name="customfieldinstance",
            name="id",
            field=models.UUIDField(
                default=uuid.uuid4, primary_key=True, serialize=False
            ),
        ),
    ]
