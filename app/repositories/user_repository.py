from app.db import get_cursor


def get_user_by_email(email: str):
    """Obtiene un usuario por su email."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, lastName, role, password, email
            FROM users
            WHERE email = %s
            """,
            (email,),
        )
        return cursor.fetchone()


def get_school_by_sig(code_sig: str):
    """Obtiene un liceo por su codigo SIG."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            SELECT id, code_sig
            FROM schools
            WHERE code_sig = %s
            LIMIT 1
            """,
            (code_sig,),
        )
        return cursor.fetchone()


def get_or_create_default_teacher_dependencies():
    """Obtiene las dependencias por defecto para un profesor."""
    with get_cursor() as cursor:
        cursor.execute("SELECT id FROM sections ORDER BY id ASC LIMIT 1")
        section = cursor.fetchone()
        if not section:
            cursor.execute(
                """
                INSERT INTO sections (name, code_section)
                VALUES (%s, %s)
                """,
                ("Seccion General", "SEC0001"),
            )
            section = {"id": cursor.lastrowid}

        cursor.execute("SELECT id FROM loads ORDER BY id ASC LIMIT 1")
        load = cursor.fetchone()
        if not load:
            cursor.execute(
                """
                INSERT INTO loads (name, code_load)
                VALUES (%s, %s)
                """,
                ("Carga General", "LOD0001"),
            )
            load = {"id": cursor.lastrowid}

        cursor.execute("SELECT id FROM subjects ORDER BY id ASC LIMIT 1")
        subject = cursor.fetchone()
        if not subject:
            cursor.execute(
                """
                INSERT INTO subjects (name, code_subject)
                VALUES (%s, %s)
                """,
                ("Materia General", "SUB0001"),
            )
            subject = {"id": cursor.lastrowid}

        cursor.execute("SELECT id FROM evaluation_plans ORDER BY id ASC LIMIT 1")
        evaluation_plan = cursor.fetchone()
        if not evaluation_plan:
            cursor.execute(
                """
                INSERT INTO evaluation_plans (name, code_evaluation_plan)
                VALUES (%s, %s)
                """,
                ("Plan General", "EVA0001"),
            )
            evaluation_plan = {"id": cursor.lastrowid}

        return {
            "id_section": section["id"],
            "id_load": load["id"],
            "id_subject": subject["id"],
            "id_evaluation_plan": evaluation_plan["id"],
        }


def create_teacher_profile(
    user_id: int,
    school_id: int,
    section_id: int,
    load_id: int,
    subject_id: int,
    evaluation_plan_id: int,
):
    """Vincula un profesor con un liceo."""
    with get_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO teachers
                (id_user, id_school, id_section, id_load, id_subject, id_evaluation_plan)
            VALUES
                (%s, %s, %s, %s, %s, %s)
            """,
            (user_id, school_id, section_id, load_id, subject_id, evaluation_plan_id),
        )
        return cursor.lastrowid


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
    """Crea un nuevo usuario en la base de datos."""
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
