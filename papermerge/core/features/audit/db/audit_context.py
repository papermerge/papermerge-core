from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class AsyncAuditContext:
    """
    Context manager for setting audit information that will be
    captured by PostgreSQL triggers.
    """
    def __init__(
        self,
        session: AsyncSession,
        user_id: Optional[UUID] = None,
        username: Optional[str] = None,
        session_id: Optional[str] = None,
        reason: Optional[str] = None,
    ):
        self.session = session
        self.user_id = user_id
        self.username = username
        self.session_id = session_id
        self.reason = reason

    async def __aenter__(self):
        # Set PostgreSQL session variables for triggers to use
        sql = """
        SELECT set_audit_context(
            :user_id,
            :username,
            :session_id,
            :reason
        )
        """

        await self.session.execute(text(sql), {
            'user_id': str(self.user_id) if self.user_id else None,
            'username': self.username,
            'session_id': self.session_id,
            'reason': self.reason
        })
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Clear the context
        await self.session.execute(text("""
            SELECT set_config('app.user_id', '', false),
                   set_config('app.username', '', false),
                   set_config('app.session_id', '', false),
                   set_config('app.reason', '', false)
        """))
