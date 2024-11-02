import os

from fastapi import Request

from papermerge.core.features.users import schema


class RemoteUserScheme:

    async def __call__(self, request: Request) -> schema.RemoteUser | None:
        user_header_name = os.environ.get(
            "PAPERMERGE__AUTH__REMOTE_USER_HEADER", "Remote-User"
        )
        groups_header_name = os.environ.get(
            "PAPERMERGE__AUTH__REMOTE_GROUPS_HEADER", "Remote-Groups"
        )
        name_header_name = os.environ.get(
            "PAPERMERGE__AUTH__REMOTE_NAME_HEADER", "Remote-Name"
        )
        email_header_name = os.environ.get(
            "PAPERMERGE__AUTH__REMOTE_EMAIL_HEADER", "Remote-Email"
        )
        username = request.headers.get(user_header_name)
        groups = request.headers.get(groups_header_name, "")
        name = request.headers.get(name_header_name, "")
        email = request.headers.get(email_header_name, "")

        if not username:
            return None

        return schema.RemoteUser(
            username=username, groups=groups.split(","), name=name, email=email
        )
