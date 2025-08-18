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

- Web UI with desktop like experience
- OpenAPI compliant REST API
- Works with PDF, JPEG, PNG and TIFF documents
- Document Versioning
- Tags - assign colored tags to documents or folders
- Documents and Folders - users can organize documents in folders
- Document Types (i.e. Categories)
- Custom Fields (metadata) per document type
- Multi-User
- Group ownership
- Share documents and folders between users and/or groups of users
- UI is available in multiple languages
- Page Management - delete, reorder, cut, move, extract pages
- OCR (Optical Character Recognition) of the documents
- OCRed text overlay (you can download document with OCRed text overlay)
- Full Text Search of the scanned documents

## Documentation

Papermerge DMS documentation is available
at [https://docs.papermerge.io](https://docs.papermerge.io/)

## Start with Docker

In order to start Papermerge App with the most basic setup use following command:

    docker run -p 8000:80 \
        -e PAPERMERGE__SECURITY__SECRET_KEY=abc \
        -e PAPERMERGE__AUTH__PASSWORD=123 \
        papermerge/papermerge:3.5.3

For more info about various docker compose scenarios
check [documentation page](https://docs.papermerge.io/latest/setup/docker-compose/).

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

## Development

### Backend

Make sure you have installed [poetry](https://python-poetry.org/) version 2.1.
Install all dependencies:

```
$ poetry install -E pg
```

Make sure you have the following environment variables set (e.g. with direnv):

```
export PAPERMERGE__DATABASE__URL=postgresql://coco:***@127.0.0.1:5432/pmgdb
export PAPERMERGE__MAIN__MEDIA_ROOT=/home/eugen/var/pmgdata
export PAPERMERGE__MAIN__API_PREFIX='/api'
```

Start BE with following command:

```
$ poetry run task server
```

This command will start BE server on localhost port 8000.
Access its swagger docs via `http://localhost:8000/docs`

### Frontend

Switch to UI folder.

```
cd frontend/
```

Make sure following environment variables are defined (
adjust their values accordingly):

```
VITE_REMOTE_USER=admin
VITE_REMOTE_USER_ID=49e78737-7c6e-410f-ae27-315b04bdec69
VITE_REMOTE_GROUPS=admin
VITE_BASE_URL=http://localhost:8000
VITE_KEEP_UNUSED_DATA_FOR=1
```

Another vite variables you may consider:

* VITE_REMOTE_ROLES

Of course, you will need to adjust user ID, username to match your BE.

`VITE_KEEP_UNUSED_DATA_FOR` will cache data returned from BE for one second

Start FE:

```commandline
cd frontend
yarn workspace ui dev
```

This command will start FE server on `http://localhost:5173/`

To see all workspaces use:

```commandline
yarn workspaces list
```
