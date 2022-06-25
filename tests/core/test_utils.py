from django.test import override_settings

from papermerge.test import TestCase
from papermerge.core.utils import namespaced


class TestUtilsNamespaced(TestCase):

    def test_namespaced_without_namespace(self):
        assert namespaced("some_text") == "some_text"
        assert namespaced("abc") == "abc"

    @override_settings(PAPERMERGE_NAMESPACE="mything")
    def test_namespaced_with_namespace(self):
        assert namespaced("some_text") == "mything__some_text"
        assert namespaced("xyz") == "mything__xyz"

    @override_settings(PAPERMERGE_NAMESPACE="your_thing")
    def test_namespaced_with_namespace_2(self):
        assert namespaced("abc") == "your_thing__abc"
        assert namespaced("star_light") == "your_thing__star_light"
