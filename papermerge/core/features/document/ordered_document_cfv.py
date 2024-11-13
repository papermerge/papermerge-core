import uuid
from typing import Dict, Iterator
from pydantic import BaseModel

from papermerge.core.utils.misc import str2date
from papermerge.core.features.document.schema import DocumentCFV
from papermerge.core.features.custom_fields.schema import CustomFieldType
from papermerge.core.types import CFNameType, CFValueType


class DocumentCFVWithIndex(BaseModel):
    dcfv: DocumentCFV
    index: int


class DocumentCFVRow(BaseModel):
    title: str
    doc_id: uuid.UUID
    document_type_id: uuid.UUID
    cf_name: CFNameType
    cf_type: CustomFieldType
    cf_value: CFValueType


class OrderedDocumentCFV:

    def __init__(self):
        self.rows: list[DocumentCFVRow] = []

    def add(self, row: DocumentCFVRow):
        self.rows.append(row)

    def group(self) -> Dict[uuid.UUID, DocumentCFVWithIndex]:
        """Group custom fields by document"""
        result = {}
        i = 0
        for item in self.rows:
            if item.doc_id in result:
                if item.cf_type == "date":
                    value = str2date(item.cf_value)
                else:
                    value = item.cf_value
                result[item.doc_id].dcfv.custom_fields.append(
                    (item.cf_name, value, item.cf_type)
                )
            else:
                result[item.doc_id] = DocumentCFVWithIndex(
                    dcfv=DocumentCFV(
                        id=item.id,
                        title=item.title,
                        document_type_id=item.document_type_id,
                        custom_fields=[],
                    ),
                    index=i,  # so that we later sort/order
                )
                i = i + 1

        return result

    def __iter__(self) -> Iterator[DocumentCFV]:
        grouped_items = sorted(self.group().values(), key=lambda x: x.index)
        items_with_sorted_cf_names = []

        for item in grouped_items:
            # also sort by custom field names
            dcfv = item.dcfv
            dcfv.custom_fields = sorted(item.dcfv.custom_fields, key=lambda x: x[0])
            items_with_sorted_cf_names.append(dcfv)

        for item in items_with_sorted_cf_names:
            yield item
