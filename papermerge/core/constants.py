INBOX_TITLE = "inbox"
HOME_TITLE = "home"
CTYPE_FOLDER = "folder"
CTYPE_DOCUMENT = "document"
DEFAULT_THUMBNAIL_SIZE = 100  # 100 pixels wide
DEFAULT_PAGE_SIZE = 900  # 900 pixels wide
JPG = "jpg"
PAGES = "pages"
THUMBNAILS = "thumbnails"
DOCVERS = "docvers"
OCR = "ocr"
PREVIEWS = "previews"
DEFAULT_TAG_BG_COLOR = "#c41fff"
DEFAULT_TAG_FG_COLOR = "#ffffff"
S3_WORKER_PROCESS_UPLOAD = "process_upload"
S3_WORKER_REMOVE_DOC_VER = "s3_worker_remove_doc_vers"
S3_WORKER_REMOVE_DOC_THUMBNAIL = "s3_worker_remove_doc_thumbnail"
# bulk remove of docs thumbnails
S3_WORKER_REMOVE_DOCS_THUMBNAIL = "s3_worker_remove_docs_thumbnail"
S3_WORKER_REMOVE_PAGE_THUMBNAIL = "s3_worker_remove_page_thumbnail"
# generate document thumbnail preview i.e. one single image
# as preview for the whole document
S3_WORKER_GENERATE_DOC_THUMBNAIL = "s3_worker_generate_doc_thumbnail"
# generate preview image(s) for one or multiple document pages
S3_WORKER_GENERATE_PAGE_IMAGE = "s3_worker_generate_page_image"
WORKER_OCR_DOCUMENT = "worker_ocr_document"
# path_tmpl_worker: move one document (based on path template)
PATH_TMPL_MOVE_DOCUMENT = "path_tmpl_move_document"
# path_tmpl_worker: move multiple docs (based on path template)
PATH_TMPL_MOVE_DOCUMENTS = "path_tmpl_move_documents"
# incoming (from user) date format
INCOMING_DATE_FORMAT = "%Y-%m-%d"
# incoming (from user) year month format
INCOMING_YEARMONTH_FORMAT = "%Y-%m"

class ContentType:
    APPLICATION_PDF = "application/pdf"
    IMAGE_JPEG = "image/jpeg"
    IMAGE_PNG = "image/png"
    IMAGE_TIFF = "image/tiff"

# Define appropriate lengths for different field types
USERNAME_MAX_LENGTH = 150
EMAIL_MAX_LENGTH = 254  # RFC 5321 standard
PASSWORD_MAX_LENGTH = 255  # Sufficient for hashed passwords
NAME_MAX_LENGTH = 100  # Reasonable for first/last names
