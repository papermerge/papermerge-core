from elasticsearch_dsl import Q
from .documents import FolderIndex, DocumentIndex


TAGS_OP_ALL = 'all'
TAGS_OP_ANY = 'any'


def cleanup_search_text(user_input_text):
    # cleanup user input
    return user_input_text


def cleanup_search_tags(user_input_tags):
    result = []

    if user_input_tags:
        tags_dirty_list = user_input_tags.split(',')
        result = list(
            map(lambda tag: tag.strip(), tags_dirty_list)
        )

    return result


def tags_query(tags, tags_op=TAGS_OP_ALL):
    if tags_op == TAGS_OP_ALL:
        return tags_query_all(tags)

    return tags_query_any(tags)


def tags_query_all(tags):
    q = Q()
    for tag in tags:
        q = q & Q(
            'nested',
            path='tags',
            query=Q('match', tags__name=tag)
        )

    return q


def tags_query_any(tags):
    query = Q(
        'nested',
        path='tags',
        query=Q('terms', tags__name=tags)
    )

    return query


def folder_query(user_id, text, tags=[], tags_op=TAGS_OP_ALL):
    # never trust user input
    clean_tags_list = cleanup_search_tags(tags)
    clean_text = cleanup_search_text(text)

    match = Q('match', title=clean_text)
    wildcard = Q('wildcard', title=f'*{clean_text}*')

    query = FolderIndex.search().query(
        'match',
        user_id=user_id
    ).query(
        match | wildcard
    ).query(
        tags_query(clean_tags_list, tags_op)
    )

    return query


def document_query(user_id, text, tags=[]):
    query = DocumentIndex.search().query(
        'match',
        user_id=user_id
    ).query(
        'multi_match',
        query=text,
        fields=['title', 'text'],
        type='phrase_prefix'
    ).highlight(
        'text',
        fragment_size=25
    )

    return query
