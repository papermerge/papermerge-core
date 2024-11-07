from papermerge.core import schema


def test_basic_page(make_page):
    db_page = make_page()

    page = schema.Page.model_validate(db_page)

    assert page.jpg_url == f"/api/pages/{page.id}/jpg"
    assert page.svg_url == f"/api/pages/{page.id}/svg"
