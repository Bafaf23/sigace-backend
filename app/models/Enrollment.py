from db import get_db_cursor, mysql


class Enrollment:
    """Clase para la inscripcion de un estudiante en un colegio"""

    def __init__(
        self,
        # datos generales del usuario
        id_user: int,
        # datos del colegio
        id_school: str,
        id_section: int,
        id_year: int,
        # datos del estudiante
        gender: str,
        birth_country: str,
        birth_state: str,
        birth_municipality: str,
        state: str,
        municipality: str,
        address: str,
        blood_type: str,
        allergies: str,
        weight: str,
        height: str,
        shirt_size: str,
        shoe_size: str,
        pant_size: str,
        medical_condition: str,
        # datos de los padres
        rep_dni: str,
        rep_name: str,
        rep_last_name: str,
        rep_email: str,
        rep_phone: str,
        rep_relationship: str,
        # Datos del representante legal
        legal_representative_dni: str,
        legal_representative_name: str,
        legal_representative_last_name: str,
        legal_representative_phone: str,
        legal_representative_email: str,
        legal_representative_relationship: str,
        # Datos del estudiante para control de estudios
        condition: str,
        condition_description: str,
        code_certificate: str,
    ):
        self.id_user = id_user
        self.id_school = id_school
        self.id_section = id_section
        self.id_year = id_year
        self.gender = gender
        self.birth_country = birth_country
        self.birth_state = birth_state
        self.birth_municipality = birth_municipality
        self.state = state
        self.municipality = municipality
        self.address = address
        self.blood_type = blood_type
        self.allergies = allergies
        self.weight = weight
        self.height = height
        self.shirt_size = shirt_size
        self.shoe_size = shoe_size
        self.pant_size = pant_size
        self.medical_condition = medical_condition
        self.rep_dni = rep_dni
        self.rep_name = rep_name
        self.rep_last_name = rep_last_name
        self.rep_email = rep_email
        self.rep_phone = rep_phone
        self.rep_relationship = rep_relationship
        self.legal_representative_dni = legal_representative_dni
        self.legal_representative_name = legal_representative_name
        self.legal_representative_last_name = legal_representative_last_name
        self.legal_representative_phone = legal_representative_phone
        self.legal_representative_email = legal_representative_email
        self.legal_representative_relationship = legal_representative_relationship
        self.condition = condition
        self.condition_description = condition_description
        self.code_certificate = code_certificate

    def _execute_step(self, cursor, step: str, sql: str, params: tuple) -> None:
        try:
            cursor.execute(sql, params)
        except Exception as e:
            raise RuntimeError(f"{step}: {e}") from e

    def create_enrollment(self) -> tuple[bool, str, int]:
        """Crea el estudiante y su inscripción en una sección."""
        cursor = None
        conn = None
        try:
            conn = mysql.get_db()
            cursor = get_db_cursor()

            sql_legal_representative = """
                INSERT INTO legal_representatives
                    (dni, frist_name, last_name, phone, email, relationship, code_certificate)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            self._execute_step(
                cursor,
                "representante legal",
                sql_legal_representative,
                (
                    self.legal_representative_dni,
                    self.legal_representative_name,
                    self.legal_representative_last_name,
                    self.legal_representative_phone,
                    self.legal_representative_email,
                    self.legal_representative_relationship,
                    self.code_certificate,
                ),
            )
            id_legal_representative = cursor.lastrowid

            sql_student = """
                INSERT INTO students (
                    id_user, gender, id_legal_representative,
                    birth_country, birth_state, birth_municipality,
                    state, municipality, address,
                    blood_type, allergies, weight, height,
                    shirt_size, shoe_size, pant_size, medical_condition,
                    rep_dni, rep_name, rep_last_name, rep_phone, rep_email, rep_relationship,
                    `condition`, condition_description,
                    id_school, id_section, id_year
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            self._execute_step(
                cursor,
                "estudiante",
                sql_student,
                (
                    self.id_user,
                    self.gender,
                    id_legal_representative,
                    self.birth_country,
                    self.birth_state,
                    self.birth_municipality,
                    self.state,
                    self.municipality,
                    self.address,
                    self.blood_type,
                    self.allergies,
                    self.weight,
                    self.height,
                    self.shirt_size,
                    self.shoe_size,
                    self.pant_size,
                    self.medical_condition,
                    self.rep_dni,
                    self.rep_name,
                    self.rep_last_name,
                    self.rep_phone,
                    self.rep_email,
                    self.rep_relationship,
                    self.condition,
                    self.condition_description,
                    self.id_school,
                    self.id_section,
                    self.id_year,
                ),
            )
            student_id = cursor.lastrowid

            self._execute_step(
                cursor,
                "inscripción",
                "INSERT INTO enrollments (student_id, section_id) VALUES (%s, %s)",
                (student_id, self.id_section),
            )

            conn.commit()
            return (True, "Inscripción creada correctamente", student_id)

        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error en create_enrollment: {e}")
            return (False, f"Error al crear la inscripción: {e}", None)

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
