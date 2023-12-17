[![Tests](https://github.com/papermerge/papermerge-core/actions/workflows/tests.yml/badge.svg)](https://github.com/papermerge/papermerge-core/actions/workflows/tests.yml)

<h1 align="center">Papermerge DMS</h1>

<p align="center">
<img src="./artwork/logo.png" />
</p>

Papermerge is an open source document management system (DMS) designed for
digital archives (think PDF files).
Instead of having piles of paper documents all over your desk,
office or drawers - you can quickly scan them and configure your scanner to directly upload to
Papermerge DMS. Papermerge DMS in its turn will extract text data from the
scanned documents using Optical Character Recognition (OCR) technology, and then
index documents using full text search engine to making them searchable.

Papermerge is perfect tool for long term storage of PDF, JPEG, TIFF and PNG
documents.

This repository is the heart of Papermerge DMS project, it contains the source code of core REST API backend and frontend UI.

## Features Highlights

* Web UI with desktop like experience
* OpenAPI compliant REST API
* Works with PDF, JPEG, PNG and TIFF documents
* OCR (Optical Character Recognition) of the documents (uses [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF))
* Full Text Search of the scanned documents (supports [Solr](https://solr.apache.org/) backend, uses [Xapian](https://getting-started-with-xapian.readthedocs.io/en/latest/) by default)
* Document Versions
* Tags - assign colored tags to documents or folders
* Documents and Folders - users can organize documents in folders
* Multi-User
* Page Management - delete, reorder, cut & paste pages (uses [PikePDF](https://github.com/pikepdf/pikepdf))

## Documentation

Papermerge DMS documentation is available at [https://docs.papermerge.io](https://docs.papermerge.io/)

## Docker

In order to start Papermerge REST API server as docker image use following command:

    docker run -p 8000:80 \
        -e PAPERMERGE__SECURITY__SECRET_KEY=abc \
        -e PAPERMERGE__AUTH__PASSWORD=123 \
        papermerge/papermerge:3.0dev20


If you want initial superuser to have another username (e.g. john), use
`DJANGO_SUPERUSER_USERNAME` environment variable:

    docker run -p 8000:80 \
        -e PAPERMERGE__SECURITY__SECRET_KEY=abc \
        -e PAPERMERGE__AUTH__PASSWORD=123 \
        -e PAPERMERGE__AUTH__USERNAME=john \
        papermerge/papermerge:3.0dev20

For full list of supported environment variables check [online documentation](https://docs.papermerge.io/Settings/index.html).

## Docker Compose

By default, Papermerge REST API server uses sqlite3 database. In order to use PostgreSQL use following docker compose file:

      version: "3.9"

      x-backend: &common
        image: papermerge/papermerge:3.0dev20
        environment:
            PAPERMERGE__SECURITY__SECRET_KEY: 12345
            PAPERMERGE__AUTH__USERNAME: john
            PAPERMERGE__AUTH__PASSWORD: hohoho
            PAPERMERGE__DATABASE__URL: postgresql://scott:tiger@db:5432/mydatabase
            PAPERMERGE__REDIS__URL: redis://redis:6379/0
        volumes:
          - index_db:/core_app/index_db
          - media:/core_app/media
      services:
        web:
          <<: *common
          ports:
           - "12000:80"
          depends_on:
            - redis
            - db
        worker:
          <<: *common
          command: worker
        redis:
          image: redis:6
        db:
          image: bitnami/postgresql:14.4.0
          volumes:
            - postgres_data:/var/lib/postgresql/data/
          environment:
            POSTGRES_USER: scott
            POSTGRES_PASSWORD: tiger
            POSTGRES_DB: mydatabase
      volumes:
        postgres_data:
        index_db:
        media:

Above-mentioned docker compose file can be used to start Papermerge REST API
server which will use PostgreSQL database to store data.

For detailed description on how to start Papermerge DMS using docker compose read
[Docker Compose/Detailed Explanation](https://docs.papermerge.io/Installation/docker-compose.html#detailed-explanation)
section in online docs.

## Tests

    poetry install
    poetry shell
    pytest tests/

## Linting

Use following command to make sure that your code is formatted per PEP8 spec:

    poetry run task lint
