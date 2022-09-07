import datetime

from django.test import TestCase
from papermerge.search.backends import SQ


class SQTestCase(TestCase):

    def test_repr(self):
        assert repr(SQ(foo="bar")) == "<SQ: AND foo__content=bar>"
        assert repr(SQ(foo=1)) == "<SQ: AND foo__content=1>"

        actual = repr(SQ(foo=datetime.datetime(2009, 5, 12, 23, 17)))
        expected = "<SQ: AND foo__content=2009-05-12 23:17:00>"
        assert actual == expected

    def test_simple_nesting(self):
        sq1 = SQ(foo="bar")
        sq2 = SQ(foo="bar")
        bigger_sq = SQ(sq1 & sq2)

        actual = repr(bigger_sq)
        expected = "<SQ: AND (foo__content=bar AND foo__content=bar)>"
        assert actual == expected

        another_bigger_sq = SQ(sq1 | sq2)

        actual = repr(another_bigger_sq)
        expected = "<SQ: AND (foo__content=bar OR foo__content=bar)>"
        assert actual == expected

        one_more_bigger_sq = SQ(sq1 & ~sq2)
        actual = repr(one_more_bigger_sq)
        expected = "<SQ: AND (foo__content=bar AND NOT (foo__content=bar))>"

        assert actual == expected
