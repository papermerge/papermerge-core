# Changelog

<!-- towncrier release notes start -->

## [2.1.9] - 2023-04-01

### Fixed

- Fix Papermerge-CLI Uploading Error [issue#538](https://github.com/ciur/papermerge/issues/538)

## [2.1.8] - 2023-03-16

- Simplified docker image - ONE docker image for both backend + frontend [issue#537](https://github.com/ciur/papermerge/issues/537)


## [2.1.7] - 2023-03-09

No significant changes.


## [2.1.6] - 2023-03-02


### Fixed

- Restore command fails when using PostgreSQL [issue#514](https://github.com/ciur/papermerge/issues/514)


## [2.1.5] - 2023-01-30


### Fixed

- Fix backup/restore utility to work with latest version of Papermerge DMS (i.e. 2.1.x) [issue#508](https://github.com/ciur/papermerge/issues/508)
- Wrong breadcrumb path when openening document/folder [issue#509](https://github.com/ciur/papermerge/issues/509)


## [2.1.4] - 2023-01-03


### Fixed

- Worker infinite loop index updates [issue#502](https://github.com/ciur/papermerge/issues/502)


## [2.1.3] - 2023-01-01


### Removed

- Remove the dependency on mptt/polymorphic/polymorphic_tree packages [issue#501](https://github.com/ciur/papermerge/issues/501)


### Added

- Support for Folder+Subfolder (recursive) Import [issue#165](https://github.com/ciur/papermerge/issues/165)
- Per-User Import Folders [issue#325](https://github.com/ciur/papermerge/issues/325)


### Fixed

- Pagination should show correct current page [issue#487](https://github.com/ciur/papermerge/issues/487)


## [2.1.2] - 2022-12-24


### Fixed

- Inbox shows wrong number of items [issue#497](https://github.com/ciur/papermerge/issues/497)
- Do not allow folders and documents with same title under same parent [issue#498](https://github.com/ciur/papermerge/issues/498)


## [2.1.1] - 2022-12-17


### Added

- Use OCRmyPDF deskew feature/flag i.e. OCR process will deskew crooked pages [issue#494](https://github.com/ciur/papermerge/issues/494)


<!-- towncrier release notes end -->

## [2.1.0] - 2022-12-12

There are no bug fixes or features added in this release. This release
contains only adjustments to REST API so that it is possible now to generate practical
[rest api clients](https://github.com/papermerge/rest-api-clients).

## [2.1.0b5] - 2022-09-22

- bugfix: read OCR language preferences correctly. See [issue#75](https://github.com/papermerge/papermerge-core/issues/75)

## [2.1.0b4] - 2022-09-17

### Changed

 - bugfix: Correctly delete user data on document delete (and/or on user delete) [issue#485](https://github.com/ciur/papermerge/issues/485)
   and [issue#484](https://github.com/ciur/papermerge/issues/484)
 - bugfix: [issue#478](https://github.com/ciur/papermerge/issues/478) - Add INDEX_NAME to HAYSTACK_CONNECTIONS for elasticsearch
 - security: [issue#57](https://github.com/papermerge/papermerge-core/issues/57) IDOR vulnerability fixed

## [2.1.0b2] - 2022-09-12

### Changed

 - Pluggable search engine backends (elasticsearch, solr, xapian, whoosh)
 - Xapian search engine is set by default

## [2.1.0b1] - 2022-08-28

### Added

- REST API
- Download version with OCRed Text
- Enable/Disabled OCR for certain documents (a.k.a. skip OCR for some docs)
- [OCRmyPDF](https://github.com/jbarlow83/OCRmyPDF) + [pikepdf](https://github.com/pikepdf/pikepdf) as PDF management utilities
- Websocket notifications (via django channels)
- For IDs use UUIDs instead of integer sequence of numbers
- Real document versioning (document version is now separate db model)
- Documents merging
- Page rotation

### Changed

- UI was offloaded to newly created [ember app]https://github.com/papermerge/papermerge.js)
- JS/HTML/CSS was extracted into separate Frontend application
- SMTP/Local File system importers were extracted from the core

### Removed

- dependency on stapler (replaced with [pikepdf](https://github.com/pikepdf/pikepdf))
- papermerge.search django app
- traditional django views (replaced with REST API views)

## [2.0.0] - 2021-03-31

### Changed

- Issue #354 fixed - scroll not working on search result page
- Issue #349 fixed - pagination for pinned tags does not work
- Issue #350 fixed - Umlauts don't work
- Issue #339 fixed - IMAP import from gmail isn't working
- Issue #338 fixed - Reflected Cross-Site Scripting (XSS) in Upload Error Messages


## [2.0.0.rc38] - 2021-02-28

### Changed

- Issue #311 Fixes upgrade problems (migrations conflicts)
- Issue #314 Cross-Site Scripting (XSS) in Automation Tags
- Issue #315 Bug leads to multiple folder creation
- Issue #316 Cross-Site Scripting (XSS) in Permission Management


## [2.0.0.rc35] -  2021-02-01

Papermerge-Core was extracted from
 [PapermergeDMS](https://github.com/ciur/papermerge).


## [0.0.1] - 2017-09-10

Initial commit (in
 [this](https://github.com/ciur/papermerge) repository).
