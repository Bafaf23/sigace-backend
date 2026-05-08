from db import get_db_cursor, mysql


class School:
    """Modelo de la escuela"""

    def __init__(self, name=None, address=None, code_school=None, type=None):
        self.name = name
        self.address = address
        self.code_school = code_school
        self.type = type

    def get_all_schools() -> list[tuple] | None:
        """Obtener todas las escuelas"""
        try:
            cursor = get_db_cursor()
            sql = "SELECT * FROM schools"
            cursor.execute(sql)
            return cursor.fetchall()
        except Exception as e:
            print(f"Error en get_all_schools: {e}")
            return []
