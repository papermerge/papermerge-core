import shutil
import os
import io
import json
from pathlib import Path

import pikepdf
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import User, Document, Folder
from papermerge.core.storage import abs_path

MODELS_DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
TEST_DIR_ABS_PATH = os.path.dirname(
    os.path.dirname(MODELS_DIR_ABS_PATH)
)


class PageViewTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.doc = Document.objects.create_document(
            title="invoice.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self.doc_version = self.doc.versions.last()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.resources = Path(TEST_DIR_ABS_PATH) / 'resources'
        self.media = Path(TEST_DIR_ABS_PATH) / 'media'
        shutil.rmtree(self.media / 'docs', ignore_errors=True)
        shutil.rmtree(self.media / 'sidecars', ignore_errors=True)

    def test_page_view_in_json_format(self):
        """
        GET /pages/{id}/
        Accept: application/vnd.api+json
        """
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO('Hello Page!'))
        response = self.client.get(
            reverse('pages_page', args=(page.pk,)),
            HTTP_ACCEPT='application/vnd.api+json'
        )

        assert response.status_code == 200

        json_data = json.loads(response.content)
        assert json_data['data']['id'] == '1'
        assert json_data['data']['attributes'] == {
            'lang': 'deu',
            'number': 1,
            'text': 'Hello Page!'
        }

    def test_page_view_in_svg_format(self):
        """
        GET /pages/{id}/
        Accept: image/svg+xml
        """
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO('Hello Page!'))
        response = self.client.get(
            reverse('pages_page', args=(page.pk,)),
            HTTP_ACCEPT='image/svg+xml'
        )

        # SVG image is not yet available, but
        # at least status code is not 500
        assert response.status_code == 404

    def test_page_view_in_jpg_format(self):
        """
        GET /pages/{id}/
        Accept: image/jpeg
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc_version.document
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO('Hello Page!'))
        response = self.client.get(
            reverse('pages_page', args=(page.pk,)),
            HTTP_ACCEPT='image/jpeg'
        )

        assert response.status_code == 200

    def test_page_view_in_text_format(self):
        """
        GET /pages/{id}/
        Accept: text/plain
        """
        self.doc_version.create_pages(page_count=1)
        page = self.doc_version.pages.first()

        page.update_text_field(io.StringIO('Hello Page!'))
        response = self.client.get(
            reverse('pages_page', args=(page.pk,)),
            HTTP_ACCEPT='text/plain'
        )

        assert response.status_code == 200
        assert response.content.decode('utf-8') == 'Hello Page!'

    def test_page_delete(self):
        """
        DELETE /pages/{id}/
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        pages = self.doc_version.pages.all()
        third_page = pages.all()[2]

        for page in pages:
            page.update_text_field(io.StringIO(f'Hello Page {page.number}!'))

        # at this point document has only one version
        assert doc.versions.count() == 1
        # last version has 3 pages
        last_version = doc.versions.last()
        assert last_version.pages.count() == 3
        pdf_file = pikepdf.Pdf.open(abs_path(last_version.document_path))
        assert len(pdf_file.pages) == 3

        # delete last (i.e. 3rd) page
        response = self.client.delete(
            reverse('pages_page', args=(third_page.pk,)),
        )
        assert response.status_code == 204

        # at this point document has two versions
        assert doc.versions.count() == 2
        # last version has 2 pages
        last_version = doc.versions.last()
        assert last_version.pages.count() == 2
        pdf_file = pikepdf.Pdf.open(abs_path(last_version.document_path))
        assert len(pdf_file.pages) == 2
        pdf_file.close()

    def test_page_delete_preserves_text_fields(self):
        """
        After deleting a page a new document will be created.
        The pages of new version will reuse text field from document's
        previous version. In this test we consider a document with two pages
        - page one contains text 'fish'
        - page two conains text 'cat'
        We delete first page ('fish' page). Newly created document
        version will have one page with text 'cat' in it.
        """
        payload = open(self.resources / 'living-things.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'living-things.pdf',
            file_name='living-things.pdf'
        )
        pages = self.doc_version.pages.all()

        for page, text in zip(pages, ['fish', 'cat']):
            page.update_text_field(io.StringIO(text))

        fish_page = pages[0]
        assert fish_page.text == 'fish'

        response = self.client.delete(
            reverse('pages_page', args=(fish_page.pk,)),
        )
        assert response.status_code == 204
        last_version = doc.versions.last()
        assert last_version.pages.count() == 1

        cat_page = last_version.pages.all()[0]
        # assert that text field is reused across document versions
        assert cat_page.text == 'cat'
        # document's version text field was updated as well
        assert last_version.text == 'cat'

    def test_page_delete_archived_page(self):
        """
        Assert that deleting an archived page is not allowed.
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        pages = self.doc_version.pages.all()
        third_page = pages.all()[2]

        # Once document version is bump, all pages referenced
        # by `pages` variable become archived
        doc.version_bump()

        # try to delete archived page
        response = self.client.delete(
            reverse('pages_page', args=(third_page.pk,)),
        )
        assert response.status_code == 400
        err_msg = response.data[0]['detail']
        assert err_msg == 'Deleting archived page is not allowed'

    def test_pages_delete(self):
        """
        DELETE /pages/
        Content-Type: application/json
        {
            "pages": [1, 2, 3]
        }
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc_version.document
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        pages = self.doc_version.pages.all()
        page_ids = [page.pk for page in pages]

        for page in pages:
            page.update_text_field(io.StringIO(f'Hello Page {page.number}!'))

        # at this point document has only one version
        assert doc.versions.count() == 1
        # last version has 3 pages
        last_version = doc.versions.last()
        assert last_version.pages.count() == 3

        response = self.client.delete(
            reverse('pages'),
            data={
                "pages": page_ids[-2:]  # delete last two pages
            },
            format='json'
        )
        assert response.status_code == 204

        # at this point document has two versions
        assert doc.versions.count() == 2
        # last version has only one page left
        last_version = doc.versions.last()
        assert last_version.pages.count() == 1
        pdf_file = pikepdf.Pdf.open(abs_path(last_version.document_path))
        assert len(pdf_file.pages) == 1
        pdf_file.close()

    def test_pages_delete_preserves_text_fields(self):
        """
        After deleting two pages new document will be created.
        The pages of new version will reuse text field from document's
        previous version. In this test we consider a document with three pages
        - page one contains text 'page 1'
        - page two contains text 'page 2'
        - page two contains text 'page 3'
        We delete first page two pages. Newly created document
        version will have one page with text 'page 3' in it.
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        pages = self.doc_version.pages.all()

        for page, text in zip(pages, ['page 1', 'page 2', 'page 3']):
            page.update_text_field(io.StringIO(text))

        page_1 = pages[0]
        page_2 = pages[1]
        assert page_1.text == 'page 1'
        assert page_2.text == 'page 2'

        data = {
            'pages': [page_1.pk, page_2.pk]
        }

        # delete first two pages
        response = self.client.delete(reverse('pages'), data, format='json')

        assert response.status_code == 204
        last_version = doc.versions.last()
        assert last_version.pages.count() == 1

        last_page = last_version.pages.all()[0]
        # assert that text field is reused across document versions
        assert last_page.text == 'page 3'
        # document's version text field was updated as well
        assert last_version.text == 'page 3'

    def test_document_ver_must_have_at_least_one_page_delete_one_by_one(self):
        """
        Document version must have at least one page.

        In this scenario document version has 3 pages.
        Deleting first two pages one by one should be OK.
        However, after first two steps, document version will have only
        one page left; in such case deleting that last page should
        result in error.
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc_version.document
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        # Delete pages one by one.
        # Deleting first page should be OK
        page_id = self.doc.versions.last().pages.last().pk
        response = self.client.delete(
            reverse('pages'),
            data={
                "pages": [page_id]
            },
            format='json'
        )
        assert response.status_code == 204
        assert response.data == {
            'pages': [
                str(page_id)
            ]
        }
        # Deleting next page should be OK as well
        page_id = self.doc.versions.last().pages.last().pk
        response = self.client.delete(
            reverse('pages'),
            data={
                "pages": [page_id]
            },
            format='json'
        )
        assert response.status_code == 204
        assert response.data == {
            'pages': [
                str(page_id)
            ]
        }
        # Deleting last page should result in error
        page_id = self.doc.versions.last().pages.last().pk
        response = self.client.delete(
            reverse('pages'),
            data={
                "pages": [page_id]
            },
            format='json'
        )
        assert response.status_code == 400
        err_msg = response.data[0]['detail']
        assert err_msg == 'Document version must have at least one page'

        last_version = self.doc.versions.last()
        assert last_version.pages.count() == 1
        pdf_file = pikepdf.Pdf.open(abs_path(last_version.document_path))
        assert len(pdf_file.pages) == 1
        pdf_file.close()

    def test_document_ver_must_have_at_least_one_page_delete_bulk(self):
        """
        Document version must have at least one page.

        In this scenario document version has 3 pages.
        Deleting all three pages should result in error because otherwise
        it will heave document version with 0 pages.
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc_version.document
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        page_ids = [page.pk for page in self.doc.versions.last().pages.all()]
        response = self.client.delete(
            reverse('pages'),
            # trying to delete ALL pages in document version
            data={"pages": page_ids},
            format='json'
        )
        assert response.status_code == 400
        err_msg = response.data[0]['detail']
        assert err_msg == 'Document version must have at least one page'

        # no page was deleted
        last_version = self.doc.versions.last()
        assert last_version.pages.count() == 3
        pdf_file = pikepdf.Pdf.open(abs_path(last_version.document_path))
        assert len(pdf_file.pages) == 3
        pdf_file.close()

    def test_delete_pages_from_archived_version(self):
        """
        Archived document version is any document version which is not last.
        Only last document version is editable - in the context of
        this scenario, only pages of very last document version
        can be deleted.

        In this scenario page deletion performed via `pages` endpoint.
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc_version.document
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        # all pages are from same document version
        # which at this moment is last document version
        page_ids = [page.pk for page in self.doc.versions.last().pages.all()]
        # Deleting
        response = self.client.delete(
            reverse('pages'),
            data={
                "pages": [page_ids[0]]
            },
            format='json'
        )
        assert response.status_code == 204
        # At this point page_ids are not part of
        # document last document version (because previous
        # page deletion incremented document version by one).
        # If we try to delete page_ids[1] now, it must result
        # in error because we are trying to edit an archived document version
        response = self.client.delete(
            reverse('pages'),
            data={
                "pages": [page_ids[1]]
            },
            format='json'
        )
        assert response.status_code == 400
        err_msg = response.data[0]['detail']
        assert err_msg == 'Deleting archived page is not allowed'

    def test_pages_reorder(self):
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        pages = self.doc_version.pages.all()
        pages_data = [
            {
                'id': pages[0].id,
                'old_number': pages[0].number,  # = 1
                'new_number': 3
            }, {
                'id': pages[1].id,
                'old_number': pages[1].number,  # = 2
                'new_number': 2
            }, {
                'id': pages[2].id,
                'old_number': pages[2].number,  # = 3
                'new_number': 1
            },
        ]

        response = self.client.post(
            reverse('pages_reorder'),
            data={
                "pages": pages_data  # reorder pages
            },
            format='json'
        )

        assert response.status_code == 204

    def test_pages_rotate(self):
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        pages = self.doc_version.pages.all()
        pages_data = [
            {
                'id': pages[0].id,
                'angle': 90
            }
        ]

        response = self.client.post(
            reverse('pages_rotate'),
            data={
                "pages": pages_data  # rotate pages
            },
            format='json'
        )

        assert response.status_code == 204

    def test_pages_rotate_preserves_text_field(self):
        payload = open(self.resources / 'living-things.pdf', 'rb')
        doc = self.doc
        doc.upload(
            payload=payload,
            file_path=self.resources / 'living-things.pdf',
            file_name='living-things.pdf'
        )
        pages = self.doc_version.pages.all()

        for page, text in zip(pages, ['fish', 'cat']):
            page.update_text_field(io.StringIO(text))

        fish_page = pages[0]
        assert fish_page.text == 'fish'

        pages_data = [
            {
                'id': pages[0].id,
                'angle': 90
            }
        ]

        response = self.client.post(
            reverse('pages_rotate'),
            data={
                "pages": pages_data  # rotate pages
            },
            format='json'
        )

        assert response.status_code == 204

        last_version = doc.versions.last()
        assert last_version.pages.count() == 2

        fish_page = last_version.pages.all()[0]
        # assert that text field is reused across document versions
        assert fish_page.text == 'fish'

        cat_page = last_version.pages.all()[1]
        # assert that text field is reused across document versions
        assert cat_page.text == 'cat'

        # document's version text field was updated as well
        assert last_version.text == 'fish cat'

    def test_move_to_document_1(self):
        """
        Move two pages from source document to destination document.

        Initially both source and destination document have
        one document_version with three pages each.
        If page move (two pages from source moved to destination)
        is completed successfully, destination document's latest version will
        have five pages and source document's latest version will have one
        page.
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        source = Document.objects.create_document(
            title="source.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        source.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        destination = Document.objects.create_document(
            title="destination.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        destination.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        source_page_ids = [
            page.id for page in source.versions.last().pages.all()[0:2]
        ]

        pages_data = {
            'pages': source_page_ids,
            'dst': destination.id,
            'position': 0
        }
        response = self.client.post(
            reverse('pages_move_to_document'),
            data=pages_data,
            format='json'
        )

        assert response.status_code == 204

        # source document has one extra version
        assert source.versions.count() == 2
        src_doc_version = source.versions.last()
        assert src_doc_version.pages.count() == 1
        pdf_file = pikepdf.Pdf.open(abs_path(src_doc_version.document_path))
        # payload of source's last version has now one page
        assert len(pdf_file.pages) == 1

        # destination document has one extra version
        assert destination.versions.count() == 2
        dst_doc_version = destination.versions.last()
        assert dst_doc_version.pages.count() == 5
        # payload of destination's last version has now 5 pages
        pdf_file = pikepdf.Pdf.open(abs_path(dst_doc_version.document_path))
        assert len(pdf_file.pages) == 5

    def test_move_to_folder_with_single_page_flag_on(self):
        """
        Move two pages from source document to destination folder
        with single page flag 'on'.

        Initially both source and destination document have
        one document_version with three pages each.
        If page move (two pages from source moved to destination)
        is completed successfully, in destination folder's
        will contains two new documents with one page each.
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        source = Document.objects.create_document(
            title="source.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        source.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        destination_folder = Folder.objects.create(
            title="Destination Folder",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        source_page_ids = [
            page.id for page in source.versions.last().pages.all()[0:2]
        ]

        pages_data = {
            'pages': source_page_ids,
            'dst': destination_folder.id,
            'single_page': True
        }
        response = self.client.post(
            reverse('pages_move_to_folder'),
            data=pages_data,
            format='json'
        )

        assert response.status_code == 204

        assert source.versions.count() == 2
        src_doc_version = source.versions.last()
        # new version of the source document will have two
        # pages less (two pages were extracted)
        assert src_doc_version.pages.count() == 1
        pdf_file = pikepdf.Pdf.open(abs_path(src_doc_version.document_path))
        # payload of source's last version has now one page
        assert len(pdf_file.pages) == 1

        assert destination_folder.children.count() == 2

        for child in destination_folder.children.all():
            last_ver = child.versions.last()
            pdf_file = pikepdf.Pdf.open(abs_path(last_ver.document_path))
            # (last version of) newly created document has only one pages
            assert len(pdf_file.pages) == 1

    def test_move_to_folder_with_multi_page(self):
        """
        Move two pages from source document to destination folder
        with single page flag 'off'.

        Initially both source and destination document have
        one document_version with three pages each.
        If page move (two pages from source moved to destination)
        is completed successfully, in destination folder's
        will contains one new document with two pages.
        """
        payload = open(self.resources / 'three-pages.pdf', 'rb')
        source = Document.objects.create_document(
            title="source.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        source.upload(
            payload=payload,
            file_path=self.resources / 'three-pages.pdf',
            file_name='three-pages.pdf'
        )
        destination_folder = Folder.objects.create(
            title="Destination Folder",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        source_page_ids = [
            page.id for page in source.versions.last().pages.all()[0:2]
        ]

        pages_data = {
            'pages': source_page_ids,
            'dst': destination_folder.id,
            'single_page': False
        }
        response = self.client.post(
            reverse('pages_move_to_folder'),
            data=pages_data,
            format='json'
        )

        assert response.status_code == 204

        assert source.versions.count() == 2
        src_doc_version = source.versions.last()
        # new version of the source document will have two
        # pages less (two pages were extracted)
        assert src_doc_version.pages.count() == 1
        pdf_file = pikepdf.Pdf.open(abs_path(src_doc_version.document_path))
        # payload of source's last version has now one page
        assert len(pdf_file.pages) == 1

        assert destination_folder.children.count() == 1

        newly_created_document = destination_folder.children.first()
        last_ver = newly_created_document.versions.last()
        pdf_file = pikepdf.Pdf.open(abs_path(last_ver.document_path))
        # (last version of) newly created document has two pages
        assert len(pdf_file.pages) == 2
