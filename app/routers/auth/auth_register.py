from db import mysql, get_db_cursor
from flask import jsonify, request, Blueprint
from werkzeug.security import generate_password_hash
import re

auth_bp = Blueprint("auth_register", __name__)


@auth_bp.route("/register/", methods=["POST"])
def register_user():
    """Registra un nuevo usuario en la base de datos"""
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400
    # -------------------------------------------------------------------------------------
    # Validacion de datos
    # -------------------------------------------------------------------------------------
    # Documento
    if not re.match(r"^[0-9]{8}$", data.get("document")):
        return jsonify({"error": "El documento debe tener 8 digitos"}), 400

    # Email
    if not re.match(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", data.get("email")
    ):
        return jsonify({"error": "El email no es valido"}), 400

    # Telefono
    if not re.match(r"^[0-9]{11}$", data.get("phone")):
        return jsonify({"error": "El telefono debe tener 11 digitos"}), 400

    # Nombres capitalizados
    data["name"] = data["name"].capitalize()
    data["lastName"] = data["lastName"].capitalize()

    dni = f"{data['typeDocuement']}{data['document']}"

    conn = mysql.get_db()
    cursor = get_db_cursor()

    cursor.execute("SELECT * FROM users WHERE email = %s", (data.get("email"),))
    user = cursor.fetchone()

    cursor.execute("SELECT * FROM schools WHERE code_sig = %s", (data.get("sig"),))
    school = cursor.fetchone()
    if not school:
        cursor.close()
        return (
            jsonify({"error": "El codigo SIG no corresponde a ninguna institucion"}),
            400,
        )

    if user:
        cursor.close()
        return jsonify({"error": "Usuario ya registrado"}), 400

    else:
        """Insertar el usuario en la tabla de users"""
        sql = "INSERT INTO users (dni, first_name, last_name, email, phone, birthdate, pass, role) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        vale = (
            dni,
            data["name"],
            data["lastName"],
            data["email"],
            data["phone"],
            data["birthdate"],
            generate_password_hash(data["password"]),
            data["role"],
        )
        cursor.execute(sql, vale)

        user_id = cursor.lastrowid

        if data["role"] == "teacher":
            """Insertar el profesor en la tabla de teachers"""
            sql_teacher = "INSERT INTO teachers (id_user, id_school, id_subject) VALUES (%s, %s, %s)"
            values_teacher = (user_id, data["sig"], 1)
            cursor.execute(sql_teacher, values_teacher)

        conn.commit()
        cursor.close()
        print("Usuario registrado correctamente")
        return jsonify({"success": True}), 200
