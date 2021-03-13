|Generic badge|

.. |Generic badge| image:: https://github.com/papermerge/papermerge-core/actions/workflows/pep8.yml/badge.svg
   :target: https://github.com/papermerge/papermerge-core/actions/workflows/pep8.yml


Papermerge Core
################

This python package is the heart of Papermerge project. It consists of a set
of reusable Django apps which are (re)used across different flavors of
Papermerge Document Management System (DMS). Package contains the core
functionality, models and API used throughout Papermerge ecosystem.

Technically speaking, it contains following django apps:

* ``papermerge.core`` - the epicenter of papermerge project
* ``papermerge.contrib.admin`` - user interface is defined here
* ``papermerge.search`` - unified search API

This package is intended to be part of Django project `like this one <https://github.com/ciur/papermerge/>`_ for example.

What is Papermerge?
~~~~~~~~~~~~~~~~~~~

Papermerge is an open source document management system (DMS) primarily
designed for archiving and retrieving your digital documents. Instead of
having piles of paper documents all over your desk, office or drawers - you
can quickly scan them and configure your scanner to directly upload to
Papermerge DMS. Papermerge DMS on its turn will extract text data from the
scanned documents using Optical Character Recognition (OCR) technology the
index it and make it searchable. You will be able to quickly find any
(scanned!) document using full text search capabilities.

Papermerge is perfect tool to manage PDF, JPEG, TIFF and PNG formats.

.. figure:: img/screenshot.png


Features Highlights
~~~~~~~~~~~~~~~~~~~

* Documents of pdf, jpg, png, tiff formats are supported
* Desktop like user interface
* Per page OCR (Optical Character Recognition) of the documents
* Full Text Search of the scanned documents
* Document Versions
* User defined metadata per folder/document/page
* Import documents from multiple sources (local disk, email, web upload, REST API upload)
* Tags - assign colored tags to documents or folders
* Documents and Folders - users can organize documents in folders
* Multi-User (Groups, Roles)
* User permissions management
* Document permissions management
* REST API
* Page Management - delete, reorder, cut & paste pages
* Automation