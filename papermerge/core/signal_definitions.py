from django.dispatch import Signal

"""
Sent immediately after document upload complete.
Arguments:
    document_version - model instance of newly created document version
"""
document_post_upload = Signal()

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
