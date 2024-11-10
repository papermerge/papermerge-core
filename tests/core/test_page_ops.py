def test_move_all_pages_of_the_doc_out_mix(_):
    """Scenario tests moving of ALL page of source document.
    In this case source document will be entirely deleted:

              Mix strategy
         src   -[S1, S2]->   dst
    old -> new       old -> new
     S1    X          D1    S1
     S2               D2    S2
                      D3    D1
                            D2
                            D3

    after operation src document is deleted
    """
    user = user_recipe.make()
    src = maker.document(resource="living-things.pdf", user=user, include_ocr_data=True)
    dst = maker.document(resource="d3.pdf", user=user, include_ocr_data=True)
    # Initial visual checks:
    # count of document versions and number of pages in the doc
    assert src.versions.count() == 1  # (1)
    assert src.versions.last().pages.count() == 2
    assert dst.versions.count() == 1  # (2)
    assert dst.versions.last().pages.count() == 3

    src_ver = src.versions.last()
    saved_src_pages_ids = list([page.id for page in src_ver.pages.order_by("number")])
    dst_ver = dst.versions.last()
    dst_page = dst_ver.pages.all()[0]

    [result_old_doc, result_new_doc] = move_pages(
        # we are moving out all pages of the source doc version
        source_page_ids=[str(page.id) for page in src_ver.pages.all()],
        target_page_id=str(dst_page.id),
        move_strategy=MoveStrategy.MIX,
    )

    dst.refresh_from_db()
    assert result_old_doc is None  # Old doc/Source was deleted
    assert result_new_doc.id == dst.id

    # Source document was deleted
    assert Document.objects.filter(pk=src.id).count() == 0
    # Destination document's version was inc + 1
    assert dst.versions.count() == 2
    # dst's last version's count of pages has one page more
    assert dst.versions.last().pages.count() == 5  # previously was 3

    dst_new_pages = dst.versions.last().pages.all()
    dst_old_pages = dst.versions.first().pages.all()
    """
              Mix strategy
         src   -[S1, S2]->   dst
    old -> new       old -> new     index
     S1    X          D1    S1        0
     S2               D2    S2        1
                      D3    D1        2
                            D2        3
                            D3        4

    after operation src document is deleted
    """


def test_move_all_pages_of_the_doc_out_replace_strategy(_):
    """Scenario tests moving of ALL page of source document.
    In this case source document will be entirely deleted:

              Replace strategy
         src   -[S1, S2]->   dst
    old -> new       old -> new
     S1    X          D1    S1
     S2               D2    S2
                      D3

    after operation src document is deleted
    """
    user = user_recipe.make()
    src = maker.document(resource="living-things.pdf", user=user, include_ocr_data=True)
    dst = maker.document(resource="d3.pdf", user=user, include_ocr_data=True)
    # Initial visual checks:
    # count of document versions and number of pages in the doc
    assert src.versions.count() == 1  # (1)
    assert src.versions.last().pages.count() == 2
    assert dst.versions.count() == 1  # (2)
    assert dst.versions.last().pages.count() == 3

    src_ver = src.versions.last()
    saved_src_pages_ids = list([page.id for page in src_ver.pages.order_by("number")])
    dst_ver = dst.versions.last()
    dst_page = dst_ver.pages.all()[0]

    [result_old_doc, result_new_doc] = move_pages(
        # we are moving out all pages of the source doc version
        source_page_ids=[str(page.id) for page in src_ver.pages.all()],
        target_page_id=str(dst_page.id),
        move_strategy=MoveStrategy.REPLACE,
    )

    dst.refresh_from_db()
    assert result_old_doc is None  # Old doc/Source was deleted
    assert result_new_doc.id == dst.id

    # Source document was deleted
    assert Document.objects.filter(pk=src.id).count() == 0
    # Destination document's version was inc + 1
    assert dst.versions.count() == 2
    assert dst.versions.last().pages.count() == 2

    dst_new_pages = dst.versions.last().pages.all()
    """
              Replace strategy
         src   -[S1, S2]->   dst
    old -> new       old -> new
     S1    X          D1    S1
     S2               D2    S2
                      D3

    after operation src document is deleted
    """
