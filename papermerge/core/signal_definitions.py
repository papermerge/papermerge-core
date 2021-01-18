from django.dispatch import Signal

# signals sent by the worker
# have sender set to ``papermerge.core.signals_deginitions.WORKER``
WORKER = "worker"

automates_matching = Signal(
    providing_args=[
        "user_id",
        "level",
        "message",
        "document_id",
        "page_num",
        # text against which matching is performed
        # i.e. extracted text of the page
        "text",
        "namespace"
    ]
)

# sent by the worker
# after ocr of the page is complete i.e.
# when both .txt file and .hocr files are available
page_ocr = Signal(
    providing_args=[
        "user_id",
        "level",
        "message",
        "document_id",
        "page_num",
        "namespace",
        # status is a string: started, complete
        "status"
    ]
)

# sent by the worker after .txt file was extracted
post_page_txt = Signal(
    providing_args=[
        "user_id",
        "document_id",
        "file_name",
        "page_num",
        "namespace",
        "text"
    ]
)

# sent by the worker after .hocr file was extracted
post_page_hocr = Signal(
    providing_args=[
        "user_id",
        "document_id",
        "fle_name",
        "page_num",
        "lang",
        "namespace",
        "step",
        "hocr"
    ]
)

# Sent by core.views.documents.create_folder
# Sent AFTER one single folder was created
folder_created = Signal(
    providing_args=[
        "user_id",
        "level",
        "message",
        "folder_id"
    ]
)

# Sent by core.views.nodes.nodes_view
# Sent AFTER one of more nodes were batch deleted
nodes_deleted = Signal(
    providing_args=[
        "user_id",
        "level",
        "message",
        # node tags is a list of
        # '<a href="{node.id}">{node.title}</a>'
        "node_tags"
    ]
)

