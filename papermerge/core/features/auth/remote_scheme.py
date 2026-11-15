import ipaddress
import logging
from fastapi import Request

from papermerge.core.features.users import schema
from papermerge.core.config import settings

logger = logging.getLogger(__name__)


def is_trusted_proxy(client_host: str | None, trusted_proxies_str: str) -> bool:
    """
    Check if the client IP/host matches any configured trusted proxy (IP, CIDR, or hostname).
    """
    if not trusted_proxies_str or not client_host:
        return False

    client_ip = None
    try:
        client_ip = ipaddress.ip_address(client_host)
    except ValueError:
        pass

    proxies = [p.strip() for p in trusted_proxies_str.split(",") if p.strip()]
    for proxy in proxies:
        if client_host == proxy:
            return True
        try:
            if "/" in proxy:
                if client_ip and client_ip in ipaddress.ip_network(proxy, strict=False):
                    return True
            else:
                if client_ip and client_ip == ipaddress.ip_address(proxy):
                    return True
        except ValueError:
            continue

    return False


class RemoteUserScheme:

    async def __call__(self, request: Request) -> schema.RemoteUser | None:
        if not settings.remote_user_auth_enabled:
            return None

        client_host = request.client.host if request.client else None
        if not is_trusted_proxy(client_host, settings.remote_user_trusted_proxies):
            logger.warning(
                f"Remote user authentication rejected: client host '{client_host}' is not a trusted proxy"
            )
            return None

        user_header_name = settings.remote_user_header
        groups_header_name = settings.remote_groups_header
        roles_header_name = settings.remote_roles_header
        name_header_name = settings.remote_name_header
        email_header_name = settings.remote_email_header

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
