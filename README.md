[![Tests](https://github.com/papermerge/papermerge-core/actions/workflows/tests.yml/badge.svg)](https://github.com/papermerge/papermerge-core/actions/workflows/tests.yml)

# Papermerge REST API Server

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

* OpenAPI compliant REST API
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

For an overview on REST API is available [here](https://docs.papermerge.io/REST%20API/index.html).

Detailed online REST API reference can be viewed as:

- [redoc](https://docs.papermerge.io/redoc/)
- [swagger](https://docs.papermerge.io/swagger-ui/)

Note that REST API reference documentation is generated from
OpenAPI schema. OpenAPI schema is stored in its own dedicated
repository [papermerge/openapi-schema](https://github.com/papermerge/openapi-schema).

Papermerge DMS documentation is available at [https://docs.papermerge.io](https://docs.papermerge.io/)

## Docker

In order to start Papermerge REST API server as docker image use following command:

    docker run -p 8000:8000 \
        -e PAPERMERGE__MAIN__SECRET_KEY=abc \
        -e DJANGO_SUPERUSER_PASSWORD=123 \
        papermerge/papermerge:latest


If you want initial superuser to have another username (e.g. john), use
`DJANGO_SUPERUSER_USERNAME` environment variable:

    docker run -p 8000:8000 \
        -e PAPERMERGE__MAIN__SECRET_KEY=abc \
        -e DJANGO_SUPERUSER_PASSWORD=123 \
        -e DJANGO_SUPERUSER_USERNAME=john \
        papermerge/papermerge:latest

For full list of supported environment variables check [online documentation](https://docs.papermerge.io/Settings/index.html).

## Docker Compose

By default Papermerge REST API server uses sqlite3 database. In order to use PostgreSQL use following docker compose file:

    version: '3.7'
    services:
      app:
        image: papermerge/papermerge
        environment:
          - PAPERMERGE__MAIN__SECRET_KEY=abc
          - DJANGO_SUPERUSER_PASSWORD=12345
          - PAPERMERGE__DATABASE__TYPE=postgres
          - PAPERMERGE__DATABASE__USER=postgres
          - PAPERMERGE__DATABASE__PASSWORD=123
          - PAPERMERGE__DATABASE__NAME=postgres
          - PAPERMERGE__DATABASE__HOST=db
        ports:
          - 8000:8000
        depends_on:
          - db
      db:
        image: bitnami/postgresql:14.4.0
        volumes:
          - postgres_data:/var/lib/postgresql/data/
        environment:
          - POSTGRES_PASSWORD=123
    volumes:
        postgres_data:version: '3.7'

Above mentioned docker compose file can be used to start Papermerge REST API server which will use PostgreSQL database to store data.

For detailed description on how to start Papermerge DMS using docker compose read
[Docker Compose/Detailed Explanation](https://docs.papermerge.io/Installation/docker-compose.html#detailed-explanation)
section in online docs.

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
