from io import BytesIO

from fastapi.testclient import TestClient
from httpx import AsyncClient
from pydantic import BaseModel, ConfigDict

from papermerge.core import orm
from papermerge.core.types import MimeType


class AuthTestClient(BaseModel):
    user: orm.User
    test_client: TestClient | AsyncClient

    # Config
    model_config = ConfigDict(arbitrary_types_allowed=True)

    def post(self, *args, **kwargs):
        return self.test_client.post(*args, **kwargs)

    def get(self, *args, **kwargs):
        return self.test_client.get(*args, **kwargs)

    def delete(self, *args, **kwargs):
        return self.test_client.request("DELETE", *args, **kwargs)

    def patch(self, *args, **kwargs):
        """
        Example:

            url = f'/nodes/{folder.id}'
            response = auth_api_client.patch(
                url,
                json={'title': 'New Title'}
            )
        """
        return self.test_client.patch(*args, **kwargs)


class DocumentTestFileType(BaseModel):
    filename: str
    file_obj: BytesIO
    content_type: MimeType

    def as_upload_tuple(self) -> tuple[str, BytesIO, str]:
        """Convert to format expected by httpx/requests files parameter"""
        self.file_obj.seek(0)  # Reset stream
        return (self.filename, self.file_obj, self.content_type.value)

    model_config = ConfigDict(arbitrary_types_allowed=True)
