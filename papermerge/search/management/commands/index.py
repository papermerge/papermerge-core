from django.conf import settings
from django.core.management.base import BaseCommand
from salinic import IndexRO, create_engine

from papermerge.core.models import BaseTreeNode
from papermerge.search.schema import FOLDER, PAGE, Model, Tag


class Command(BaseCommand):
    help = """
    Index specified node_ids

    If node_ids are node provided, index all nodes
    """

    def add_arguments(self, parser):
        parser.add_argument("node_ids", nargs="*")

    def handle(self, *args, **options):
        if options["node_ids"]:
            nodes = BaseTreeNode.objects.filter(pk__in=options['node_ids'])
        else:
            nodes = BaseTreeNode.objects.all()

        engine = create_engine(settings.SEARCH_URL)
        index = IndexRO(engine, schema=Model)

        for node in nodes:
            self.stdout.write(f"Indexing {node}")
            if not node.parent_id:
                continue

            if node.is_document:
                doc = node.document
                last_ver = doc.versions.last()

                for page in last_ver.pages.all():
                    model = Model(
                        id=str(page.id),
                        title=node.title,
                        user_id=str(node.user_id),
                        document_id=str(node.document.id),
                        document_version_id=str(last_ver.id),
                        page_number=page.number,
                        page_count=page.page_count,
                        text=page.text,
                        parent_id=str(node.parent_id),
                        entity_type=PAGE,
                        tags=[
                            Tag(name=tag.name) for tag in node.tags.all()
                        ],
                    )
            else:
                model = Model(
                    id=str(node.id),
                    title=node.title,
                    user_id=str(node.user_id),
                    entity_type=FOLDER,
                    tags=[Tag(name=tag.name) for tag in node.tags.all()],
                )

            index.add(model)
