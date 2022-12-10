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
