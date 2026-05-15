from flask import Blueprint, jsonify, request, session
from db import get_db_cursor
from werkzeug.security import check_password_hash

# Blueprint para el login de usuarios
auth_login_bp = Blueprint("auth_login", __name__)


@auth_login_bp.route("/login/", methods=["POST"])
def login_user() -> tuple[dict, int]:
    """Login de usuarios"""

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email y contraseña son requeridos"}), 400

    cursor = None
    try:
        cursor = get_db_cursor()
        sql = """
            SELECT u.*, t.id_school, s.name AS school_name, s.code_sig 
            FROM users u
            LEFT JOIN teachers t ON u.id = t.id_user
            LEFT JOIN schools s ON t.id_school = s.code_sig
            WHERE u.email = %s AND u.status = 1
        """
        cursor.execute(sql, (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "Usuario no encontrado o inactivo"}), 404

        if not check_password_hash(user["pass"], password):
            return jsonify({"error": "Contraseña incorrecta"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor is not None:
            cursor.close()

    # Establecer la sesión del usuario
    session["loggedin"] = True
    session["id"] = user["id"]
    session["dni"] = user["dni"]
    session["email"] = user["email"]
    session["role"] = user["role"]
    session["school_id"] = user["id_school"]
    session["name"] = user["first_name"]
    session["lastName"] = user["last_name"]

    print(f"Inicio de sesión exitoso: {session['email']}")

    return (
        jsonify(
            {
                "success": True,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "role": user["role"],
                    "school_id": user["id_school"],
                    "name": user["first_name"],
                    "lastName": user["last_name"],
                },
            }
        ),
        200,
    )
