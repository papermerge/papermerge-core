
def get_resource(context):
    """
    Determine the resource name for renderer/parser's context.
    Default to objects if not defined.
    """
    ret = getattr(context.get('view').get_serializer().Meta, 'resource_name', 'objects')
    return ret
