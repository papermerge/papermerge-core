from django.conf import settings
from django.core.management.base import BaseCommand

from papermerge.core.models import BaseTreeNode
from papermerge.search.feisar import Session, create_engine
from papermerge.search.schema import EntityType
from papermerge.search.schema import Page as IndexEntity


class Command(BaseCommand):
    help = """
    Index all available nodes/documents/folders/pages
    """

    def handle(self, *args, **options):
        engine = create_engine(settings.SEARCH_URL)
        session = Session(engine)

        for node in BaseTreeNode.objects.all():
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
                        entity_type=EntityType.page
                    )
            else:  # is folder
                index_entity = IndexEntity(
                    id=str(node.id),
                    title=node.title,
                    user_id=str(node.user_id),
                    entity_type=EntityType.folder,
                    parent_id=str(node.parent_id)
                )

            if index_entity:
                session.add(index_entity)
