from django.conf import settings
from django.core.management.base import BaseCommand
from salinic import IndexRO, Search, create_engine

from papermerge.search.schema import Model


class Command(BaseCommand):
    help = """
    Search for nodes/documents/folders/pages
    """

    def add_arguments(self, parser):
        parser.add_argument("q")

    def handle(self, *args, **options):
        querystring = options.get('q')

        if querystring:
            if len(querystring.strip()) == 36:  # if query is just an UUID
                querystring = querystring.replace('-', '').lower()

        engine = create_engine(settings.SEARCH_URL)
        index = IndexRO(engine, schema=Model)

        sq = Search(Model).query(querystring)

        for entity in index.search(sq):
            self.stdout.write(f'{entity}')
