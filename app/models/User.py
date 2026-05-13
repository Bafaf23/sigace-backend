from asyncio import streams

from werkzeug.datastructures.headers import T
from db import get_db_cursor, mysql
from werkzeug.security import generate_password_hash


class User:
    """
    Modelo de usuario para la tabla users de la base de datos
    Args:
        dni: str
        first_name: str
        last_name: str
        email: str
        phone: str
        birthdate: str
        password: str
        role: str
        school_id: str
    """

    def __init__(
        self,
        dni: str,
        first_name: str,
        last_name: str,
        email: str,
        phone: str,
        birthdate: str,
        password: str,
        role: str,
        school_id: str,
    ):
        self.dni = dni
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.phone = phone
        self.birthdate = birthdate
        self.password = password
        self.role = role
        self.school_id = school_id

    @classmethod
    def get_user_by_dni(cls, dni: str) -> tuple | None:
        """Obtener un usuario por su DNI"""
        try:
            cursor = get_db_cursor()
            cursor.execute(
                "SELECT id, dni, first_name, last_name, email, phone, birthdate, role, age FROM users WHERE dni = %s",
                (dni,),
            )
            return cursor.fetchone()
        except Exception as e:
            print(f"Error en get_user_by_dni: {e}")
            return []

    def register_user(self) -> tuple[bool, str]:
        """Crear un usuario"""
        cursor = None
        conn = None
        try:
            cursor = get_db_cursor()
            conn = mysql.get_db()

            cursor.execute(
                "SELECT code_sig FROM schools WHERE code_sig = %s", (self.school_id,)
            )
            school = cursor.fetchone()
            if not school:
                return (
                    False,
                    f"El codigo SIG {self.school_id} no corresponde a una institucion",
                )

            cursor.execute("SELECT email FROM users  WHERE email = %s", (self.email,))
            user = cursor.fetchone()
            if user:
                return (
                    False,
                    f"El email {self.email} ya esta registrado",
                )

            sql = "INSERT INTO users (dni, first_name, last_name, email, phone, birthdate, pass, role) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
            values = (
                self.dni,
                self.first_name,
                self.last_name,
                self.email,
                self.phone,
                self.birthdate,
                generate_password_hash(self.password),
                self.role,
            )

            cursor.execute(sql, values)

            user_id = cursor.lastrowid

            if self.role == "teacher":
                """Crear un profesor por defecto para la institucion"""

                sql_teacher = "INSERT INTO teachers (id_user, id_school, id_subject) VALUES (%s, %s, %s)"
                values_teacher = (user_id, self.school_id, 1)
                cursor.execute(sql_teacher, values_teacher)

            conn.commit()
            cursor.close()
            conn.close()
            if self.role == "teacher":
                return (
                    True,
                    "Profesor registrado correctamente",
                )
            else:
                return True
        except Exception as e:
            print(f"Error en create_user: {e}")
            cursor.close()
            conn.close()
            return False
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    @classmethod
    def get_teachers_all(cls, school_id: str) -> tuple[list]:
        try:
            cursor = get_db_cursor()

            sql = "SELECT teachers.* FROM teachers LEFT JOIN users ON teachers.id = users.id WHERE id_school = %s"

            cursor.execute(sql, (school_id,))
            cursor.close()
            return cursor.fetchone()
        except Exception as e:
            print(f"Error en el modelo User al traer a los profesores: {e}")
