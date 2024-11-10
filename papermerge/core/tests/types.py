from enum import Enum


class ResourceFile(str, Enum):
    D3_PDF = "d3.pdf"
    S3_PDF = "s3.pdf"
    LIVING_THINGS = "living-things.pdf"
    THREE_PAGES = "three-pages.pdf"
