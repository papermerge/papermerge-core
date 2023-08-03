from django.conf import settings
from django.core.management.base import BaseCommand
from salinic import Search, Session, create_engine

from papermerge.search.schema import IndexEntity


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
        session = Session(engine)

        sq = Search(IndexEntity).query(querystring)

        for entity in session.exec(sq):
            self.stdout.write(f'{entity}')
