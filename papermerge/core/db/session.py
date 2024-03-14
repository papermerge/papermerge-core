from sqlalchemy.orm import Session, sessionmaker

from .engine import get_engine


def get_session() -> Session:
    engine = get_engine()
    Session = sessionmaker(engine)
    return Session()
