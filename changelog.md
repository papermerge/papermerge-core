# Changelog


## 2.1.0b4 - Work in progress

### Changed

 - Security [issue#57 IDOR](https://github.com/papermerge/papermerge-core/issues/57) fixed

## [2.1.0b2] - 2022-09-12

### Changed

 - Pluggable search engine backends (elasticsearch, solr, xapia, whoosh)
 - Xapian search engine is set by default

## [2.1.0b1] - 2022-08-28

### Added

- REST API
- Download version with OCRed Text
- Enable/Disabled OCR for certain documents (a.k.a skip OCR for some docs)
- [OCRmyPDF](https://github.com/jbarlow83/OCRmyPDF) + [pikepdf](https://github.com/pikepdf/pikepdf) as PDF management utilities
- Websocket notifications (via django channnels)
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

Papermerge-Core is was extracted from
 [PapermergeDMS](https://github.com/ciur/papermerge).


## [0.0.1] - 2017-09-10

Initial commit (in
 [this](https://github.com/ciur/papermerge) repository).
