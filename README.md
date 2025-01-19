[![Tests](https://github.com/papermerge/papermerge-core/actions/workflows/tests.yml/badge.svg)](https://github.com/papermerge/papermerge-core/actions/workflows/tests.yml)


<p align="center">
<img src="./artwork/logo-w160px.png" />
</p>
<h1 align="center">Papermerge DMS</h1>

Papermerge DMS or simply Papermerge is a open source document management system
designed to work with scanned documents (also called digital archives). It
extracts text from your scans using OCR, indexes
them, and prepares them for full text search. Papermerge provides the look and feel
of modern desktop file browsers. It has features like dual panel document
browser, drag and drop, tags, hierarchical folders and full text search so that
you can efficiently store and organize your documents.

It supports PDF, TIFF, JPEG and PNG document file formats.
Papermerge is perfect tool for long term storage of your documents.

<p align="center">
<img src="./artwork/papermerge3-3.png" />
</p>

## Features Highlights

* Web UI with desktop like experience
* OpenAPI compliant REST API
* Works with PDF, JPEG, PNG and TIFF documents
* OCR (Optical Character Recognition) of the documents
* OCRed text overlay (you can download document with OCRed text overlay)
* Full Text Search of the scanned documents
* Document Versioning
* Tags - assign colored tags to documents or folders
* Documents and Folders - users can organize documents in folders
* Document Types (i.e. Categories)
* Custom Fields (metadata) per document type
* Multi-User
* Page Management - delete, reorder, cut, move, extract pages

## Documentation

Papermerge DMS documentation is available at [https://docs.papermerge.io](https://docs.papermerge.io/)

## Start with Docker

In order to start Papermerge App with the most basic setup use following command:

    docker run -p 8000:80 \
        -e PAPERMERGE__SECURITY__SECRET_KEY=abc \
        -e PAPERMERGE__AUTH__PASSWORD=123 \
        papermerge/papermerge:3.3.1

For more info about various docker compose scenarios check [documentation page](https://docs.papermerge.io/3.3/setup/docker-compose/).


## Demo Page

Online demo is available at: https://demo.papermerge.com

```
Username: demo
Password: demo
```

Please note that, in order to save resources, online demo instance is deployed
using very basic setup: there is no OCR worker and no full text search engine
behind. Online instance is reseted every 24 hours (0:00 UTC timezone). Reset
means that all data is restored to initial state and all documents are deleted.
