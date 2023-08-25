from django.conf import settings
from django.core.management.base import BaseCommand
from salinic import SchemaManager, create_engine

from papermerge.search.schema import Model

CREATE = 'create'
APPLY = 'apply'
DELETE = 'delete'


class Command(BaseCommand):
    help = """Index schema management"""

    def add_arguments(self, parser):
        parser.add_argument("action", choices=[CREATE, APPLY, DELETE])

    def handle(self, *args, **options):
        action = options.get("action")
        engine = create_engine(settings.SEARCH_URL)
        schema_manager = SchemaManager(engine, model=Model)

        if action == DELETE:
            schema_manager.delete()
        elif action == APPLY:
            schema_manager.apply()
        else:
            schema_manager.delete()
