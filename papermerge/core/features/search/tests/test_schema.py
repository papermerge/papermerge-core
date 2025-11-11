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
