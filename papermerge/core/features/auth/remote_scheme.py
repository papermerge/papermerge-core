from fastapi import Request

from papermerge.core.features.users import schema
from papermerge.core.config import settings


class RemoteUserScheme:

    async def __call__(self, request: Request) -> schema.RemoteUser | None:
        user_header_name = settings.remote_user_header
        groups_header_name = settings.remote_user_groups_header
        roles_header_name = settings.remote_user_roles_header
        name_header_name = settings.remote_user_name_header
        email_header_name = settings.remote_user_email_header

        username = request.headers.get(user_header_name)
        groups = request.headers.get(groups_header_name, "")
        roles = request.headers.get(roles_header_name, "")
        name = request.headers.get(name_header_name, "")
        email = request.headers.get(email_header_name, "")

        if not username:
            return None

        return schema.RemoteUser(
            username=username,
            groups=groups.split(","),
            roles=roles.split(","),
            name=name,
            email=email,
        )
