from db import get_db_cursor, mysql
from werkzeug.security import check_password_hash, generate_password_hash


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
        confirm_password: str,
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
        self.confirm_password = confirm_password
        self.role = role
        self.school_id = school_id

    @classmethod
    def get_user_by_dni(cls, dni: str) -> tuple[bool, str] | tuple[bool, str, dict]:
        """Obtener un usuario por su DNI"""
        cursor = None
        try:
            cursor = get_db_cursor()
            cursor.execute(
                "SELECT id, dni, first_name, last_name, email, phone, birthdate, role, age FROM users WHERE dni = %s",
                (dni,),
            )
            user = cursor.fetchone()

            if not user:
                return (
                    False,
                    f"El usuario con Cedula de identidad {dni} no esta registrado",
                )

            return (True, "Usuario encontrado correctamente", user)

        except Exception as e:
            print(f"Error en get_user_by_dni: {e}")
            return (False, f"Error al obtener el usuario: {e}")
        finally:
            if cursor:
                cursor.close()

    @classmethod
    def authenticate(
        cls, email: str, password: str
    ) -> tuple[bool, str] | tuple[bool, str, dict]:
        """Validar DNI y contraseña; devuelve datos públicos del usuario (sin hash)."""
        cursor = None
        try:
            if not email or not password:
                return (False, "Email y contraseña son requeridos")

            cursor = get_db_cursor()
            cursor.execute(
                "SELECT users.id, users.dni, users.first_name, users.last_name, users.email, users.phone, users.birthdate, users.role, users.age, users.pass, teachers.id_school FROM users LEFT JOIN teachers ON users.id = teachers.id_user WHERE users.email = %s AND users.status = 1",
                (email,),
            )
            user = cursor.fetchone()
            if not user:
                return (False, "Credenciales incorrectas")
                
            if not check_password_hash(user["pass"], password):
                return (False, "Credenciales incorrectas")

            public = {k: v for k, v in user.items() if k != "pass"}
            return (True, "Inicio de sesion exitoso", public)
        except Exception as e:
            print(f"Error en authenticate: {e}")
            return (False, f"Error al iniciar sesion: {e}")
        finally:
            if cursor:
                cursor.close()

    def register_user(self) -> tuple[bool, str] | None:
        """Crear un usuario"""
        cursor = None
        try:
            cursor = get_db_cursor()
            conn = mysql.get_db()

            # Verificar si la institucion existe
            cursor.execute(
                "SELECT code_sig FROM schools WHERE code_sig = %s", (self.school_id,)
            )
            school = cursor.fetchone()

            if not school:
                cursor.close()
                conn.close()
                return (
                    False,
                    f"El codigo SIG {self.school_id} no corresponde a una institucion",
                )

            cursor.execute("SELECT email FROM users  WHERE email = %s", (self.email,))

            user = cursor.fetchone()

            if user:
                cursor.close()
                conn.close()
                return (False, f"El usuario ya esta registrado")

            if self.password != self.confirm_password:
                cursor.close()
                conn.close()
                return (False, "Las contraseñas no coinciden")

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

            """Relacion del usuario con la institucion en la tabla teachers si es profesor"""
            if self.role == "teacher":
                sql_teacher = (
                    "INSERT INTO teachers (id_user, id_school) VALUES (%s, %s)"
                )
                values_teacher = (user_id, self.school_id)

                cursor.execute(sql_teacher, values_teacher)

            conn.commit()
            return (True, "Usuario registrado correctamente")
        except Exception as e:
            if cursor:
                cursor.close()

            print(f"Error en create_user: {e}")
            return (False, f"Error al registrar el usuario: {e}")
        finally:
            if cursor:
                cursor.close()

    @classmethod
    def get_teachers_all(
        cls, school_id: str
    ) -> tuple[bool, str] | tuple[bool, str, list]:
        cursor = None
        try:
            cursor = get_db_cursor()

            sql = "SELECT teachers.* FROM teachers LEFT JOIN users ON teachers.id_user = users.id WHERE teachers.id_school = %s"

            cursor.execute(sql, (school_id,))
            teachers = cursor.fetchall()

            if not teachers:
                return (False, "No se encontraron profesores")

            return (True, "Profesores encontrados correctamente", teachers)
        except Exception as e:
            print(f"Error en el modelo User al traer a los profesores: {e}")
            return (False, f"Error al obtener los profesores: {e}")
        finally:
            if cursor:
                cursor.close()
