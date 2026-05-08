from db import get_db_cursor, mysql


class Subject:
    """Modelo de la asignatura"""

    def __init__(
        self,
        id=None,
        name=None,
        school_id=None,
        year_subject=None,
        code_subject=None,
        training_area=None,
    ):
        self.id = id
        self.name = name
        self.school_id = school_id
        self.year_subject = year_subject
        self.code_subject = code_subject
        self.training_area = training_area

    @classmethod
    def get_all_subjects(cls, school_id: int) -> list[tuple] | None:
        """Obtener todas las asignaturas"""
        try:
            cursor = get_db_cursor()
            sql = (
                "SELECT * FROM subjects WHERE school_id = %s ORDER BY year_subject ASC"
            )
            cursor.execute(sql, (school_id,))
            return cursor.fetchall()
        except Exception as e:
            print(f"Error en get_by_school: {e}")
            return []

    def create_subject(self) -> bool:
        """Crear una asignatura"""
        try:
            cursor = get_db_cursor()
            conn = mysql.get_db()
            cursor.execute(
                "INSERT INTO subjects (name, school_id, year_subject, code_subject, training_area) VALUES (%s, %s, %s, %s, %s)",
                (
                    self.name,
                    self.school_id,
                    self.year_subject,
                    self.code_subject,
                    self.training_area,
                ),
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(e)
            return False

    def delete_subject(self) -> bool:
        """Eliminar una asignatura"""
        cursor = get_db_cursor()
        conn = mysql.get_db()
        cursor.execute("DELETE FROM subjects WHERE id = %s", (self.id,))
        conn.commit()
        return cursor.rowcount > 0
