from django.core.management.base import BaseCommand

from papermerge.core.models import Document


class Command(BaseCommand):
    help = """
    List all available documents
    """

    def handle(self, *args, **options):
        self.stdout.write("UUID\ttitle\tOCR Status\t")
        for doc in Document.objects.all():
            self.stdout.write(
                f"{doc.id}\t{doc.title}\t{doc.ocr_status}\t"
            )
