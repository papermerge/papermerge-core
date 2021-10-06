from rest_framework.parsers import JSONParser as OrigJSONParser

from papermerge.core.rest import utils


class JSONParser(OrigJSONParser):
    """
    Removes root key from incoming json.

    Emberjs sends json strings formatted as (e.g. for 'group' model):
    {"group": {"name": "g1"}}. This parser strips resource name "group" i.e.
    example above becomes {"name": "g1"}.
    Json formatted as {"name": "g1"} is REST Framework native.
    """

    def parse(self, stream, media_type=None, parser_context=None):
        parsed = super().parse(
            stream,
            media_type=media_type,
            parser_context=parser_context
        )
        resource = utils.get_resource(context=parser_context)
        return parsed[resource]
