from fastapi.testclient import TestClient
from pydantic import BaseModel, ConfigDict

from papermerge.core.models import User


class AuthTestClient(BaseModel):
    user: User
    test_client: TestClient

    # Config
    model_config = ConfigDict(arbitrary_types_allowed=True)

    def post(self, *args, **kwargs):
        return self.test_client.post(*args, **kwargs)

    def get(self, *args, **kwargs):
        return self.test_client.get(*args, **kwargs)

    def delete(self, *args, **kwargs):
        return self.test_client.request(
            "DELETE",
            *args,
            **kwargs
        )

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
