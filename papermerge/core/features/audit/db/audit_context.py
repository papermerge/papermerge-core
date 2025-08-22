from typing import Optional
from uuid import UUID
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


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
        self._context_set = False

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

        try:
            await self.session.execute(text(sql), {
                'user_id': str(self.user_id) if self.user_id else None,
                'username': self.username,
                'session_id': self.session_id,
                'reason': self.reason
            })
            self._context_set = True
            logger.debug(f"Set audit context for user {self.username} ({self.user_id})")
        except SQLAlchemyError as e:
            logger.warning(f"Failed to set audit context: {e}")
            self._context_set = False

        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Only clear context if it was successfully set and session is still usable
        if not self._context_set:
            return

        # Check if session is in a valid state
        if not self._is_session_usable():
            logger.warning("Session is not usable, skipping audit context cleanup")
            return

        try:
            # Clear the context
            await self.session.execute(text("""
                SELECT set_config('app.user_id', '', false),
                       set_config('app.username', '', false),
                       set_config('app.session_id', '', false),
                       set_config('app.reason', '', false)
            """))
            logger.debug("Cleared audit context")
        except SQLAlchemyError as e:
            # Don't raise exceptions during cleanup, just log them
            logger.warning(f"Failed to clear audit context: {e}")

    def _is_session_usable(self) -> bool:
        """
        Check if the session is in a usable state.
        Returns False if the session has been rolled back or is otherwise unusable.
        """
        try:
            # Check session state - if it's not active or has been rolled back, we can't use it
            if not self.session.is_active:
                return False

            # Check if there's a pending rollback
            if hasattr(self.session, '_transaction') and self.session._transaction:
                if hasattr(self.session._transaction, '_rollback_exception'):
                    return False

            return True
        except Exception:
            # If we can't determine the state, assume it's not usable
            return False
