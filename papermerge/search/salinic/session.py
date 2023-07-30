import json
import typing

import xapian
from pydantic import BaseModel

from .field import Field, IdField, KeywordField, TextField
from .search import SearchQuery


class Session:
    def __init__(self, engine, language="en"):
        self._engine = engine
        self._termgenerator = xapian.TermGenerator()
        self._termgenerator.set_stemmer(xapian.Stem(language))
        self._queryparser = xapian.QueryParser()
        self._queryparser.set_stemmer(xapian.Stem(language))
        self._queryparser.set_stemming_strategy(self._queryparser.STEM_SOME)

    def add(self, entity: BaseModel):
        doc = xapian.Document()
        self._termgenerator.set_document(doc)

        primary_key_name = None

        for name, field in entity.model_fields.items():
            if field.annotation in (str, typing.Optional[str]):
                value = getattr(entity, name)
                if isinstance(value, Field):
                    insert_value = value.default
                else:
                    insert_value = value
                if not insert_value:
                    continue

                if isinstance(field.default, TextField):
                    self._termgenerator.index_text(
                        insert_value,
                        1,
                        name.upper()  # the prefix
                    )
                    # index field without prefix for general search
                    self._termgenerator.index_text(insert_value)
                    self._termgenerator.increase_termpos()
                elif isinstance(field.default, KeywordField):
                    doc.add_boolean_term(
                        name.upper() + insert_value.lower()
                    )
                elif isinstance(field.default, IdField):
                    id_as_term = insert_value.replace('-', '')
                    doc.add_boolean_term(
                        name.upper() + id_as_term
                    )
                    self._termgenerator.index_text(
                        id_as_term,
                        1,
                        name.upper()  # the prefix
                    )
                    self._termgenerator.index_text(id_as_term)
                    self._termgenerator.increase_termpos()

            if isinstance(field.default, Field) and field.default.primary_key:
                primary_key_name = name

        doc.set_data(
            json.dumps(entity.model_dump())
        )

        if not primary_key_name:
            raise ValueError("No primary field defined")

        identifier = getattr(entity, primary_key_name)
        idterm = f"Q{identifier}"

        self._engine._db.replace_document(idterm, doc)

    def exec(self, sq: SearchQuery):
        results = []
        for name, field in sq._entity.model_fields.items():
            self._queryparser.add_prefix(name, name)

        query = self._queryparser.parse_query(sq._query)
        enquire = xapian.Enquire(self._engine._db)
        enquire.set_query(query)

        for match in enquire.get_mset(0, 10):
            fields = json.loads(match.document.get_data().decode('utf8'))
            results.append(sq._entity(**fields))

        return results
