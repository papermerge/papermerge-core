import uuid
from collections.abc import Sequence
from datetime import date
from enum import Enum
from typing import Generic, Literal, TypeAlias, TypeVar

from fastapi import Query
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")
DocumentVersion = TypeVar("DocumentVersion")


CType = Literal["document", "folder"]


class OCRStatusEnum(str, Enum):
    unknown = "UNKNOWN"
    received = "RECEIVED"
    started = "STARTED"
    success = "SUCCESS"
    failure = "FAILURE"


class PaginatedResponse(BaseModel, Generic[T]):
    page_size: int
    page_number: int
    num_pages: int
    items: Sequence[T]

    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    user_id: str
    username: str
    email: str
    scopes: list[str] = []
    groups: list[str] = []
    roles: list[str] = []


CFValueType: TypeAlias = str | int | date | bool | float | None
CFNameType: TypeAlias = str


class OrderEnum(str, Enum):
    asc = "asc"
    desc = "desc"

class CFVValueColumn(str, Enum):
    TEXT = 'value_text'
    INT = 'value_int'
    FLOAT = 'value_float'
    DATE = 'value_date'
    MONETARY = 'value_monetary'
    BOOLEAN = 'value_boolean'
    YEARMONTH = 'value_yearmonth'


class PaginatedQueryParams(BaseModel):
    page_size: int = Query(5, ge=1, description="Number of items per page")
    page_number: int = Query(
        1, ge=1, description="Page number. It is first, second etc. page?"
    )
    filter: str | None = None


class ImagePreviewStatus(str, Enum):
    """Image preview status

    1. If database field `preview_status` is NULL ->
        image preview was not considered yet i.e. client
        have not asked for it yet.
    2. "pending" - image preview was scheduled, as client has asked
        for it, but has not started yet
    3. "ready - image preview complete:
        a. preview image was generated
        b. preview image was uploaded to S3
    4. "failed" image preview failed
    """
    ready = "ready"
    pending = "pending"
    failed = "failed"


class ImagePreviewSize(str, Enum):
    sm = "sm"  # small
    md = "md"  # medium
    lg = "lg"  # large
    xl = "xl"  # extra large


class MimeType(str, Enum):
    application_pdf = "application/pdf"
    image_jpeg = "image/jpeg"
    image_png = "image/png"
    image_tiff = "image/tiff"


class FolderType(str, Enum):
    """
    Type of special folder.
    """
    HOME = "home"
    INBOX = "inbox"


class OwnerType(str, Enum):
    """
    Type of owner for a special folder.

    Special folders can be owned by either individual users or groups.
    """
    USER = "user"
    GROUP = "group"


class Owner(BaseModel):
    owner_type: OwnerType
    owner_id: uuid.UUID

    @staticmethod
    def create_from(
        user_id: uuid.UUID | None = None,
        group_id: uuid.UUID | None = None
    ) -> "Owner":
        if group_id is not None:
            return Owner(owner_type=OwnerType.GROUP, owner_id=group_id)
        elif user_id is not None:
            return Owner(owner_type=OwnerType.USER, owner_id=user_id)
        else:
            raise ValueError("Either user_id or group_id must be provided")


class ResourceType(str, Enum):
    """Resources that can be owned"""
    NODE = "node"
    CUSTOM_FIELD = "custom_field"
    DOCUMENT_TYPE = "document_type"
    TAG = "tag"


class Resource(BaseModel):
    type: ResourceType
    id: uuid.UUID


class NodeResource(Resource):
    type: ResourceType = ResourceType.NODE


class CustomFieldResource(Resource):
    type: ResourceType = ResourceType.CUSTOM_FIELD


class DocumentTypeResource(Resource):
    type: ResourceType = ResourceType.DOCUMENT_TYPE


class TagResource(Resource):
    type: ResourceType = ResourceType.TAG


class BreadcrumbRootType(str, Enum):
    """
    Type of root for breadcrumb navigation.
    Used by frontend to render the breadcrumb root differently.
    """
    HOME = "home"
    INBOX = "inbox"
    SHARED = "shared"


class DocumentLang(str, Enum):
    """ISO 639-3 language codes"""
    sqi = "sqi"  # Albanian
    bel = "bel"  # Belarusian
    bos = "bos"  # Bosnian
    bul = "bul"  # Bulgarian
    cat = "cat"  # Catalan
    hrv = "hrv"  # Croatian
    ces = "ces"  # Czech
    dan = "dan"  # Danish
    nld = "nld"  # Dutch
    eng = "eng"  # English
    est = "est"  # Estonian
    fin = "fin"  # Finnish
    fra = "fra"  # French
    glg = "glg"  # Galician
    deu = "deu"  # German
    ell = "ell"  # Greek
    hun = "hun"  # Hungarian
    isl = "isl"  # Icelandic
    gle = "gle"  # Irish
    ita = "ita"  # Italian
    lav = "lav"  # Latvian
    lit = "lit"  # Lithuanian
    ltz = "ltz"  # Luxembourgish
    mkd = "mkd"  # Macedonian
    mlt = "mlt"  # Maltese
    nor = "nor"  # Norwegian
    pol = "pol"  # Polish
    por = "por"  # Portuguese
    ron = "ron"  # Romanian
    rus = "rus"  # Russian
    srp = "srp"  # Serbian
    slk = "slk"  # Slovak
    slv = "slv"  # Slovenian
    spa = "spa"  # Spanish
    swe = "swe"  # Swedish
    ukr = "ukr"  # Ukrainian
    cym = "cym"  # Welsh
    eus = "eus"  # Basque
