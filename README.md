[![Tests](https://github.com/papermerge/papermerge-core/actions/workflows/ci.yml/badge.svg)](https://github.com/papermerge/papermerge-core/actions/workflows/ci.yml)

# Papermerge RESTful Backend Server


This python package is the heart of Papermerge project. It consists of a set
of reusable Django apps which are consumed across different bundles of
Papermerge Document Management System (DMS).

Technically speaking, it contains following Django apps:

* ``papermerge.core`` - the epicenter of Papermerge DMS project
* ``papermerge.notifications`` - Django Channels app for sending notifications via websockets
* ``papermerge.search`` - RESTful search. Supports four backends: [Xapian](https://getting-started-with-xapian.readthedocs.io/en/latest/),
  [Whoosh](https://whoosh.readthedocs.io/en/latest/intro.html), [Elasticsearch](https://github.com/elastic/elasticsearch),
  [Solr](https://solr.apache.org/).


## What is Papermerge?

Papermerge is an open source document management system (DMS) primarily
designed for archiving and retrieving your digital documents. Instead of
having piles of paper documents all over your desk, office or drawers - you
can quickly scan them and configure your scanner to directly upload to
Papermerge DMS. Papermerge DMS on its turn will extract text data from the
scanned documents using Optical Character Recognition (OCR) technology the
index it and make it searchable. You will be able to quickly find any
(scanned!) document using full text search capabilities.

Papermerge is perfect tool to manage documents in PDF, JPEG, TIFF and PNG formats.

## Features Highlights

* RESTul API
* Works well with PDF documents
* OCR (Optical Character Recognition) of the documents (uses [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF))
* Full Text Search of the scanned documents (supports four search engine backends, uses [Xapian](https://getting-started-with-xapian.readthedocs.io/en/latest/) by default)
* Document Versions
* Tags - assign colored tags to documents or folders
* Documents and Folders - users can organize documents in folders
* Multi-User (supports user groups)
* User permissions management
* Page Management - delete, reorder, cut & paste pages (uses [PikePDF](https://github.com/pikepdf/pikepdf))


## Documentation

Online documentation is available at [https://docs.papermerge.io](https://docs.papermerge.io/)


## Tests

Test suite is divided into two big groups:

1. tests.core
2. tests.search


First group is concerned with tests which do not depend on elasticsearch while
second one **tests.search** is concerned with tests for which **depend on elasticsearch**
and as result run very slow (hence the grouping). In
order to run `tests.core` tests you need to have redis up and running; in
order to run `test.search` you need to both **redis and elasticsearch** up and
running.

Before running core tests suite, make sure redis service is up and running. Run tests:

     poetry run task test-core

Before running search tests suite, make sure both **redis and elasticsearch**
services are up and running:

     poetry run task test-search

In order to run all tests suite (core + search):

    poetry run task test


## Linting

Use following command to make sure that your code is formatted per PEP8 spec:

    poetry run task lint
