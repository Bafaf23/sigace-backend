from app.db import get_cursor


def get_user_by_email(email: str):
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, lastName, role, password, email
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,),
        )
        return cursor.fetchone()


def create_user(
    dni: str,
    name: str,
    last_name: str,
    birthdate,
    email: str,
    phone: str,
    password_hash: str,
    role: str,
):
    with get_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO users
                (dni, name, lastName, birthdate, email, phone, password, role)
            VALUES
                (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (dni, name, last_name, birthdate, email, phone, password_hash, role),
        )
        return cursor.lastrowid
