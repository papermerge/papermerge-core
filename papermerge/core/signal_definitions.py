from django.dispatch import Signal

"""
Sent immediately after document upload complete.
Arguments:
    document_version - model instance of newly created document version
"""
document_post_upload = Signal()


"""
Sent immediately after (some of) document's page(s) were moved to folder.
Arguments:
    document_version - model instance of newly created document version
"""
page_move_to_folder = Signal()

"""
Sent immediately after (some of) document's page(s) were moved to another doc.
Arguments:
    document_version - model instance of newly created document version
"""
page_move_to_document = Signal()

"""
Sent immediately after document's page(s) were rotated.
Arguments:
    document_version - model instance of newly created document version
"""
page_rotate = Signal()

"""
Sent immediately after document's page(s) were deleted.
Arguments:
    document_version - model instance of newly created document version
"""
page_delete = Signal()


"""
Sent immediately after document's page(s) were reordered.
Arguments:
    document_version - model instance of newly created document version
"""
page_reorder = Signal()


# Sent by core.views.documents.create_folder
# Sent AFTER one single folder was created
"""
    providing_args=[
        "user_id",
        "level",
        "message",
        "folder_id"
    ]
"""
folder_created = Signal()

# Sent by core.views.nodes.nodes_view
# Sent AFTER one of more nodes were batch deleted
"""
    providing_args=[
        "user_id",
        "level",
        "message",
        # node tags is a list of
        # '<a href="{node.id}">{node.title}</a>'
        "node_tags"
    ]
"""
nodes_deleted = Signal()
