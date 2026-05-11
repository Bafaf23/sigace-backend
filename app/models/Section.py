from db import get_db_cursor, mysql


class Section:
    """
    Modelo secciones
    metodos: get_section_all (trae a todas las secciones)
    """

    def __init__(
        self,
        name=None,
        code_section=None,
        teachers_id=None,
        max_cup=None,
        school_id=None,
    ):
        self.name = name
        self.code_section = code_section
        self.teachers_id = teachers_id
        self.max_cup = max_cup
        self.school_id = school_id

    @classmethod
    def get_section_all(cls, school_id: str) -> list[tuple]:
        """Trae todas las secciones de una liceo en espesifico"""
        try:
            cursor = get_db_cursor()
            sql = (
                "SELECT * FROM sections WHERE school_id = %s"
            )
            cursor.execute(sql, (school_id,))
            return cursor.fetchall()

        except Exception as e:
            print(f"error al cargar las secciones {e}")
            return []

    def create_section(self) -> bool:
        """Crear una seccion nueva en el sistema"""
        try:
            cursor = get_db_cursor()
            conn = mysql.get_db()

            sql = "INSERT INTO sections (name, code_section, teachers_id, max_cup, school_id)"
            value = (
                self.name,
                self.code_section,
                self.teachers_id,
                self.max_cup,
                self.school_id,
            )
            cursor.execute(sql, value)

            conn.commit()
            cursor.close()

            return cursor.rowcount > 0

        except Exception as e:
            print(e)
            return False
