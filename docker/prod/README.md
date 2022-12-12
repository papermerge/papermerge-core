# Papermerge REST API Server

## What is Papermerge?

Papermerge is an open source document management system (DMS)
designed for archiving and retrieving your digital documents.

For Papermerge a document is anything which is a good candidate for
archiving - some piece of information which is not editable, but you need to
store it for future reference. For example receipts are good examples - you
don't need to read receipts every day, but eventually you will need them for
your tax declaration. In this sense - scanned documents, which are usually in
PDF or TIFF format, are perfect match.

Within Papermerge context terms document, scanned document, pdf document,
and digital archive are used interchangeable and mean the same thing.


## TL;DR

The only two required environment variables are `PAPERMERGE__MAIN__SECRET_KEY` and `DJANGO_SUPERUSER_PASSWORD`:

    docker run -p 8000:8000 \
        -e PAPERMERGE__MAIN__SECRET_KEY=abc \
        -e DJANGO_SUPERUSER_PASSWORD=123 \
        papermerge/papermerge:latest

Use `POST http://localhost:8000/api/auth/login/` endpoint to authenticate.

Credentials are:

- username: admin
- password: 123

If you want initial superuser to have another username (e.g. john), use `DJANGO_SUPERUSER_USERNAME` environment variable:

    docker run -p 8000:8000 \
        -e PAPERMERGE__MAIN__SECRET_KEY=abc \
        -e DJANGO_SUPERUSER_PASSWORD=123 \
        -e DJANGO_SUPERUSER_USERNAME=john \
        papermerge/papermerge:latest

For full list of supported environment variables check [online documentation](https://docs.papermerge.io/Settings/index.html).

## Use Postgres SQL

By default Papermerge DMS uses sqlite3 database. In order to use PostgreSQL use following docker compose file:

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

Above mentioned docker compose file can be used to start Papermerge DMS REST API backend server which will use PostgreSQL database to store data.
