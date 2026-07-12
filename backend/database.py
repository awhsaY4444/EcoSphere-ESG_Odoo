import os
from sqlmodel import SQLModel, create_engine
from typing import Generator
from sqlmodel import Session

database_url = os.getenv("DATABASE_URL")
if database_url:
    # For Render/Heroku PostgreSQL compatibility
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    connect_args = {}
else:
    sqlite_file_name = "database.db"
    database_url = f"sqlite:///{sqlite_file_name}"
    connect_args = {"check_same_thread": False}

engine = create_engine(database_url, echo=False, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
