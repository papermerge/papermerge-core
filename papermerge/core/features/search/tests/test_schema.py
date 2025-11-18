from papermerge.core.features.search import schema as search_schema

def test_basic_schema():
    input = {
        "filters": {
            "tags": [
                {"values": ["blue", "green"]}
            ]
        },
        "lang": "eng"
    }
    expected_output = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            tags=[
                search_schema.TagFilter(
                    values=["blue", "green"]
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG
    )

    assert search_schema.SearchQueryParams(**input) == expected_output



def test_tag_filters_with_empty_values_1():
    """tag filters with empty values are removed from the list"""
    input = {
        "filters": {
            "tags": [
                {"values": ["blue", "green"]},
                {"values": []},
                {"values": [], "operator": "any"}
            ]
        },
        "lang": "eng"
    }
    expected_output = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            tags=[
                search_schema.TagFilter(
                    values=["blue", "green"]
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG
    )

    assert search_schema.SearchQueryParams(**input) == expected_output


def test_tag_filters_with_empty_values_2():
    """tag filters with empty values are removed from the list"""
    input = {
        "filters": {
            "tags": [
                {"values": []},
                {"values": [], "operator": "any"},
                {"values": [], "operator": "all"}
            ]
        },
        "lang": "eng"
    }
    expected_output = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(tags=[]),
        lang=search_schema.SearchLanguage.ENG
    )

    assert search_schema.SearchQueryParams(**input) == expected_output


def test_category_filters_with_empty_values():
    """category filters with empty values are removed from the list"""
    input = {
        "filters": {
            "categories": [
                {"values": []},
                {"values": [], "operator": "any"},
                {"values": [], "operator": "not"}
            ]
        },
        "lang": "eng"
    }
    expected_output = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(categories=[]),
        lang=search_schema.SearchLanguage.ENG
    )

    assert search_schema.SearchQueryParams(**input) == expected_output
