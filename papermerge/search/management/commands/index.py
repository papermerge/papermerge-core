from django.conf import settings
from django.core.management.base import BaseCommand
from salinic import Session, create_engine
from salinic.engine import AccessMode

from papermerge.core.models import BaseTreeNode
from papermerge.search.schema import FOLDER, PAGE, ColoredTag, IndexEntity


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

        engine = create_engine(settings.SEARCH_URL, mode=AccessMode.RW)
        session = Session(engine)

        for node in nodes:
            self.stdout.write(f"Indexing {node}")
            index_entity = None
            if not node.parent_id:
                continue

            if node.is_document:
                doc = node.document
                last_ver = doc.versions.last()

                for page in last_ver.pages.all():
                    index_entity = IndexEntity(
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
                            ColoredTag(
                                name=tag.name,
                                fg_color=tag.fg_color,
                                bg_color=tag.bg_color
                            ) for tag in node.tags.all()
                        ],
                        breadcrumb=[
                            (str(item[0]), item[1]) for item in node.breadcrumb
                        ]
                    )
            else:
                index_entity = IndexEntity(
                    id=str(node.id),
                    title=node.title,
                    user_id=str(node.user_id),
                    entity_type=FOLDER,
                    parent_id=str(node.parent_id),
                    tags=[
                        ColoredTag(
                            name=tag.name,
                            fg_color=tag.fg_color,
                            bg_color=tag.bg_color
                        ) for tag in node.tags.all()
                    ],
                    breadcrumb=[
                        (str(item[0]), item[1]) for item in node.breadcrumb
                    ]

                )

            if index_entity:
                session.add(index_entity)
