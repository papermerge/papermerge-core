
Papermerge Core
################

Papermerge Core reusable Django apps are the heart of Papermerge project. It is
(re)used across different flavors of Papermerge Document Management System
(DMS). It contains the core functionality, models and API used throughout
Papermerge ecosystem.

Technically speaking, it contains following django apps:

* ``papermerge.core`` - the epicenter of papermerge project
* ``papermerge.contrib.admin`` - user interface is defined here
* ``papermerge.search`` - unified search API

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
