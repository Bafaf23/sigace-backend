"""Database connection helpers for MySQL."""

import os
from contextlib import contextmanager
from urllib.parse import unquote, urlparse

import pymysql
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    """Create a new MySQL connection using environment variables."""
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        parsed = urlparse(database_url)
        return pymysql.connect(
            host=parsed.hostname or "localhost",
            port=parsed.port or 3306,
            user=unquote(parsed.username or "root"),
            password=unquote(parsed.password or ""),
            database=(parsed.path or "/sigace_db").lstrip("/"),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False,
        )

    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "sigace_db"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


@contextmanager
def get_cursor():
    """
    Yield a cursor and guarantee commit/rollback behavior.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
