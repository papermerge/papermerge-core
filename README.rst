|Generic badge|

.. |Generic badge| image:: https://github.com/papermerge/papermerge-core/actions/workflows/pep8.yml/badge.svg
   :target: https://github.com/papermerge/papermerge-core/actions/workflows/pep8.yml


Papermerge REST API Backend Server
###################################

This python package is the heart of Papermerge project. It consists of a set
of reusable Django apps which are consumed across different bundles of
Papermerge Document Management System (DMS).

Technically speaking, it contains three django apps:

* ``papermerge.core`` - the epicenter of papermerge project
* ``papermerge.avenues`` - Django Channels app which provides WebSockets interface
* ``papermerge.search`` - depricated

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

Features Highlights
~~~~~~~~~~~~~~~~~~~

* REST API
* Documents of pdf, jpg, png, tiff formats are supported
* Per page OCR (Optical Character Recognition) of the documents
* Full Text Search of the scanned documents
* Document Versions
* User defined metadata per folder/document/page
* Tags - assign colored tags to documents or folders
* Documents and Folders - users can organize documents in folders
* Multi-User (Groups, Roles)
* User permissions management
* Document permissions management
* Page Management - delete, reorder, cut & paste pages
* Automation

Unit Tests
~~~~~~~~~~~

Run all unit tests with `tox <https://tox.readthedocs.io/en/latest/index.html>`_:

.. code-block:: bash

    $ pip install -r requirements/test.txt
    $ tox

Tox will run all unit tests in python virtual environment with different version of python interpreter.
In order to run unit tests for specific python version, for example 3.7, use following command:

.. code-block:: bash

    $ tox -e py37

Tox creates a python virtual environment where it install all dependencies. For python version 3.7, virtual environment will be installed in .tox/py37 folder.
In order to run tests suite with all warnings enabled, use following commands:

.. code-block:: bash

    $ source .tox/py37/bin/activate  #  activate python virtual environment
    $ python -W all runtests.py  # run unit tests with all warning messages on
