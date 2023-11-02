import io
import json
import os
import shutil
from pathlib import Path
from unittest.mock import patch

import pikepdf
import pytest
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import Document, Folder, User
from papermerge.core.storage import abs_path

MODELS_DIR_ABS_PATH = os.path.abspath(os.path.dirname(__file__))
TEST_DIR_ABS_PATH = os.path.dirname(
    os.path.dirname(MODELS_DIR_ABS_PATH)
)


@pytest.mark.skip()
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
        assert json_data['data']['id'] == str(page.pk)
        all_attrs = json_data['data']['attributes']

        assert set(all_attrs.keys()) == {'lang', 'number', 'text', 'svg_url',
                                         'jpg_url'}

        main_attrs = {
            key: all_attrs[key] for key in all_attrs if key in (
                'lang', 'number', 'text'
            )
        }
        assert main_attrs == {
            'lang': 'deu',
            'number': 1,
            'text': 'Hello Page!'
        }

    @patch('papermerge.core.models.document_version.convert_from_path')
    def test_page_view_in_svg_format(self, _):
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_page_view_in_jpg_format(self, _):
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_page_view_in_text_format(self, _):
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_page_delete(self, _x):
        """
        DELETE /pages/{id}/
        """
        doc = self._upload(self.doc, 'three-pages.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_page_delete_preserves_text_fields(self, _):
        """
        After deleting a page a new document will be created.
        The pages of new version will reuse text field from document's
        previous version. In this test we consider a document with two pages
        - page one contains text 'fish'
        - page two conains text 'cat'
        We delete first page ('fish' page). Newly created document
        version will have one page with text 'cat' in it.
        """
        doc = self._upload(self.doc, 'living-things.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_page_delete_archived_page(self, _):
        """
        Assert that deleting an archived page is not allowed.
        """
        doc = self._upload(self.doc, 'three-pages.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_pages_delete(self, _):
        """
        DELETE /pages/
        Content-Type: application/json
        {
            "pages": [1, 2, 3]
        }
        """
        doc = self._upload(self.doc, 'three-pages.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_pages_delete_preserves_text_fields(self, _):
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
        doc = self._upload(self.doc, 'three-pages.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_document_ver_must_have_at_least_one_page_delete_one_by_one(
        self,
        _x
    ):
        """
        Document version must have at least one page.

        In this scenario document version has 3 pages.
        Deleting first two pages one by one should be OK.
        However, after first two steps, document version will have only
        one page left; in such case deleting that last page should
        result in error.
        """
        self._upload(self.doc, 'three-pages.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_document_ver_must_have_at_least_one_page_delete_bulk(self, _):
        """
        Document version must have at least one page.

        In this scenario document version has 3 pages.
        Deleting all three pages should result in error because otherwise
        it will heave document version with 0 pages.
        """
        self._upload(self.doc, 'three-pages.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_delete_pages_from_archived_version(self, _x):
        """
        Archived document version is any document version which is not last.
        Only last document version is editable - in the context of
        this scenario, only pages of very last document version
        can be deleted.

        In this scenario page deletion performed via `pages` endpoint.
        """
        self._upload(self.doc, 'three-pages.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_pages_reorder(self, _):
        self._upload(self.doc, 'three-pages.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_pages_reorder_preserves_text_fields(self, _):
        """
        Test that after changing order of page in the document,
        """
        self._upload(self.doc, 'living-things.pdf')
        pages = self.doc.versions.last().pages.all()

        for page, text in zip(pages, ['fish', 'cat']):
            page.update_text_field(io.StringIO(text))

        assert pages[0].text == 'fish'
        assert pages[0].number == 1
        assert pages[1].text == 'cat'
        assert pages[1].number == 2

        pages_data = [
            {
                'id': pages[0].id,
                'old_number': pages[0].number,  # = 1
                'new_number': 2
            }, {
                'id': pages[1].id,
                'old_number': pages[1].number,  # = 2
                'new_number': 1
            }
        ]

        response = self.client.post(
            reverse('pages_reorder'),
            data={
                "pages": pages_data  # reorder pages
            },
            format='json'
        )

        assert response.status_code == 204

        assert self.doc.versions.count() == 2
        last_version = self.doc.versions.last()
        pages = last_version.pages.all()
        assert pages[0].text == 'cat'
        assert pages[0].number == 1
        assert pages[1].text == 'fish'
        assert pages[1].number == 2

    @patch('papermerge.core.signals.ocr_document_task')
    def test_pages_reorder_reuses_ocr_data(self, _):
        """
        Asserts that page reorder reuses correctly OCR data.

        Only txt data file is checked here
        """
        self._upload(self.doc, 'three-pages.pdf')
        pages = self.doc_version.pages.all()
        # because the real OCRing is not triggered (too slow) we
        # create our own versions of txt data
        # Currently:
        # page 1 contains text 'I am page 3'
        # page 2 contains text 'I am page 2'
        # page 3 contains text 'I am page 1'
        current_order = [3, 1, 2]
        for index in range(0, 3):
            os.makedirs(
                os.path.dirname(abs_path(pages[index].txt_url)),
                exist_ok=True
            )
            with open(abs_path(pages[index].txt_url), 'w+') as f:
                f.write(f'I am page {current_order[index]}')

        pages_data = [
            {
                'id': pages[0].id,
                'old_number': pages[0].number,  # = 1
                'new_number': 3
            }, {
                'id': pages[1].id,
                'old_number': pages[1].number,  # = 2
                'new_number': 1
            }, {
                'id': pages[2].id,
                'old_number': pages[2].number,  # = 3
                'new_number': 2
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
        assert self.doc.versions.count() == 2

        new_pages = self.doc.versions.last().pages.all()
        # page 1 should contain text 'I am page 1'
        # page 2 should contain text 'I am page 2'
        # page 3 should contain text 'I am page 3'
        for index in range(0, 3):
            assert new_pages[index].number == index + 1
            with open(abs_path(new_pages[index].txt_url)) as f:
                text = f.read()
                assert text == f'I am page {index + 1}'

    @patch('papermerge.core.signals.ocr_document_task')
    def test_pages_rotate(self, _):
        self._upload(self.doc, 'three-pages.pdf')
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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_pages_rotate_preserves_text_field(self, _):
        self._upload(self.doc, 'living-things.pdf')
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

        last_version = self.doc.versions.last()
        assert last_version.pages.count() == 2

        fish_page = last_version.pages.all()[0]
        # assert that text field is reused across document versions
        assert fish_page.text == 'fish'

        cat_page = last_version.pages.all()[1]
        # assert that text field is reused across document versions
        assert cat_page.text == 'cat'

        # document's version text field was updated as well
        assert last_version.text == 'fish cat'

    @patch('papermerge.core.signals.ocr_document_task')
    def test_move_to_document_1(self, _):
        """
        Move two pages from source document to destination document.

        Initially both source and destination document have
        one document_version with three pages each.
        If page move (two pages from source moved to destination)
        is completed successfully, destination document's latest version will
        have five pages and source document's latest version will have one
        page.
        """
        source = Document.objects.create_document(
            title="source.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        destination = Document.objects.create_document(
            title="destination.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self._upload(source, 'three-pages.pdf')
        self._upload(destination, 'three-pages.pdf')

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

    @patch('papermerge.core.signals.ocr_document_task')
    def test_move_to_document_preserves_text_field(self, _):
        source = Document.objects.create_document(
            title="source.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        destination = Document.objects.create_document(
            title="destination.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self._upload(source, 'three-pages.pdf')
        self._update_text_field(source, ['cat', 'dog', 'monkey'])
        self._upload(destination, 'three-pages.pdf')
        self._update_text_field(destination, ['flower', 'tree', 'plant'])

        source_page_ids = [
            page.id for page in source.versions.last().pages.all()[0:2]
        ]
        # move first two pages from source to destination
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

        source_pages = source.versions.last().pages.all()
        destination_pages = destination.versions.last().pages.all()
        # Initially both source and destination had three pages.
        # After moving two pages from one source to destination
        # source will have only one page and destination five.
        assert source_pages.count() == 1
        assert destination_pages.count() == 5
        assert source_pages[0].text == 'monkey'

        assert destination_pages[0].text == 'cat'
        assert destination_pages[1].text == 'dog'
        assert destination_pages[2].text == 'flower'
        assert destination_pages[3].text == 'tree'
        assert destination_pages[4].text == 'plant'

    @patch('papermerge.core.signals.ocr_document_task')
    def test_move_to_document_reuses_ocr_data_copy_to_position_1(self, _):
        """
        Given two documents doc_a and doc_b, when moving
        page two pages from doc_a to doc_b, OCR data is moved correctly.

        Both documents have three pages.
        This test copies two pages from document doc_a.pdf to doc_b.pdf
        to position 1.
        """
        doc_a, doc_b, pages_a, pages_b = self._setup_pages_move_to_document()

        response = self.client.post(
            reverse('pages_move_to_document'),
            data={
                "pages": [pages_a[1].pk, pages_a[2].pk],
                "dst": doc_b.pk,
                "position": 1
            },
            format='json'
        )

        assert response.status_code == 204

        assert doc_a.versions.count() == 2
        assert doc_b.versions.count() == 2

        new_pages_b = doc_b.versions.last().pages.all()

        new_pages_text = [
            'I am page doc_b_1',
            'I am page doc_a_2',
            'I am page doc_a_3',
            'I am page doc_b_2',
            'I am page doc_b_3'
        ]

        for index in range(0, 5):
            with open(abs_path(new_pages_b[index].txt_url)) as f:
                text = f.read()
                assert text == new_pages_text[index]

    @patch('papermerge.core.signals.ocr_document_task')
    def test_move_to_document_reuses_ocr_data_copy_to_position_0(self, _):
        """
        Given two documents doc_a and doc_b, when moving
        page two pages from doc_a to doc_b, OCR data is moved correctly.

        Both documents have three pages.
        This test copies two pages from document doc_a.pdf to doc_b.pdf
        to position 0.
        """
        doc_a, doc_b, pages_a, pages_b = self._setup_pages_move_to_document()

        response = self.client.post(
            reverse('pages_move_to_document'),
            data={
                "pages": [pages_a[1].pk, pages_a[2].pk],
                "dst": doc_b.pk,
                "position": 0  # copy pages to the beginning of the target doc
            },
            format='json'
        )

        assert response.status_code == 204

        assert doc_a.versions.count() == 2
        assert doc_b.versions.count() == 2

        new_pages_b = doc_b.versions.last().pages.all()

        # newly copied pages are the beginning of the target document
        new_pages_text = [
            'I am page doc_a_2',
            'I am page doc_a_3',
            'I am page doc_b_1',
            'I am page doc_b_2',
            'I am page doc_b_3'
        ]

        for index in range(0, 5):
            with open(abs_path(new_pages_b[index].txt_url)) as f:
                text = f.read()
                assert text == new_pages_text[index]

    @patch('papermerge.core.signals.ocr_document_task')
    def test_move_to_folder_with_single_page_flag_on(self, _):
        """
        Move two pages from source document to destination folder
        with single page flag 'on'.

        Initially both source and destination document have
        one document_version with three pages each.
        If page move (two pages from source moved to destination)
        is completed successfully, in destination folder's
        will contains two new documents with one page each.
        """

        source = Document.objects.create_document(
            title="source.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self._upload(source, 'three-pages.pdf')
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
            last_ver = child.document.versions.last()
            pdf_file = pikepdf.Pdf.open(abs_path(last_ver.document_path))
            # (last version of) newly created document has only one pages
            assert len(pdf_file.pages) == 1

    @patch('papermerge.core.signals.ocr_document_task')
    def test_move_to_folder_single_paged_preserves_text_field(self, _):
        source = Document.objects.create_document(
            title="living-things.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self._upload(source, 'living-things.pdf')
        source_pages = self._update_text_field(source, ['fish', 'cat'])
        destination_folder = Folder.objects.create(
            title="Destination Folder",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )

        pages_data = {
            'pages': [source_pages[1].pk],
            'dst': destination_folder.id,
            'single_page': True
        }
        response = self.client.post(
            reverse('pages_move_to_folder'),
            data=pages_data,
            format='json'
        )

        assert response.status_code == 204

        source_last_version = source.versions.last()
        source_pages = source_last_version.pages.all()
        assert source_pages[0].text == 'fish'

        # newly created one page document
        destination_doc = destination_folder.children.last()  # and only
        destination_pages = destination_doc.document.versions.last().pages.all()
        assert destination_pages[0].text == 'cat'

    @patch('papermerge.core.signals.ocr_document_task')
    def test_move_to_folder_with_multi_page(self, _):
        """
        Move two pages from source document to destination folder
        with single page flag 'off'.

        Initially both source and destination document have
        one document_version with three pages each.
        If page move (two pages from source moved to destination)
        is completed successfully, in destination folder's
        will contains one new document with two pages.
        """
        source = Document.objects.create_document(
            title="source.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self._upload(source, 'three-pages.pdf')
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
        last_ver = newly_created_document.document.versions.last()
        pdf_file = pikepdf.Pdf.open(abs_path(last_ver.document_path))
        # (last version of) newly created document has two pages
        assert len(pdf_file.pages) == 2

    @patch('papermerge.core.signals.ocr_document_task')
    def test_move_to_folder_multi_paged_preserves_text_field(self, _):
        source = Document.objects.create_document(
            title="three-pages.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self._upload(source, 'three-pages.pdf')
        source_pages = self._update_text_field(source, ['fish', 'cat', 'doc'])
        destination_folder = Folder.objects.create(
            title="Destination Folder",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )

        pages_data = {
            'pages': [source_pages[1].pk, source_pages[2].pk],
            'dst': destination_folder.id,
            'single_page': False
        }
        response = self.client.post(
            reverse('pages_move_to_folder'),
            data=pages_data,
            format='json'
        )

        assert response.status_code == 204

        source_last_version = source.versions.last()
        source_pages = source_last_version.pages.all()
        assert source_pages[0].text == 'fish'

        # newly created one page document
        destination_doc = destination_folder.children.last()  # and only
        destination_pages = destination_doc.document.versions.last().pages.all()

        assert destination_pages[0].text == 'cat'
        assert destination_pages[1].text == 'doc'

    def _upload(self, doc, file_name):
        payload = open(self.resources / file_name, 'rb')
        doc.upload(
            payload=payload,
            file_path=self.resources / file_name,
            file_name=file_name
        )
        payload.close()
        return doc

    def _update_text_field(self, doc, list_of_page_strings):
        pages = doc.versions.last().pages.all()
        for page, text in zip(pages, list_of_page_strings):
            page.update_text_field(io.StringIO(text))

        return pages

    def _setup_pages_move_to_document(self):
        doc_a = Document.objects.create_document(
            title="doc_a.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        doc_b = Document.objects.create_document(
            title="doc_A.pdf",
            lang="deu",
            user_id=self.user.pk,
            parent=self.user.home_folder
        )
        self._upload(doc_a, 'three-pages.pdf')
        self._upload(doc_b, 'three-pages.pdf')
        pages_a = doc_a.versions.last().pages.all()
        pages_b = doc_b.versions.last().pages.all()

        for index in range(0, 3):
            os.makedirs(
                os.path.dirname(abs_path(pages_a[index].txt_url)),
                exist_ok=True
            )
            with open(abs_path(pages_a[index].txt_url), 'w+') as f:
                f.write(f'I am page doc_a_{index + 1}')

        for index in range(0, 3):
            os.makedirs(
                os.path.dirname(abs_path(pages_b[index].txt_url)),
                exist_ok=True
            )
            with open(abs_path(pages_b[index].txt_url), 'w+') as f:
                f.write(f'I am page doc_b_{index + 1}')

        return doc_a, doc_b, pages_a, pages_b
