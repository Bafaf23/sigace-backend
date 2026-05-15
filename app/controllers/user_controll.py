from flask import jsonify, Blueprint, request, session
from app.models.User import User
import re

# Blueprint para el usuario
user_controller = Blueprint("user_controller", __name__)


@user_controller.route("/register/", methods=["POST"])
def register_user() -> tuple[dict, int]:
    """Registrar un nuevo usuario"""
    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    name = data.get("name")
    lastName = data.get("lastName")
    email = data.get("email")
    phone = data.get("phone")
    birthdate = data.get("birthdate")
    password = data.get("password")
    confirm_password = data.get("passwordConfir")
    role = data.get("role")
    school_id = data.get("sig")

    type_document = data.get("typeDocuement")
    document = data.get("document")

    dni = f"{type_document}{document}"

    # Validacion de datos
    if not re.match(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", data.get("email")
    ):
        return jsonify({"error": "El email no es valido"}), 400
    if not re.match(r"^[0-9]{11}$", data.get("phone")):
        return jsonify({"error": "El telefono debe tener 11 digitos"}), 400

    user = User(
        dni=dni,
        first_name=name,
        last_name=lastName,
        email=email,
        phone=phone,
        birthdate=birthdate,
        password=password,
        confirm_password=confirm_password,
        role=role,
        school_id=school_id,
    ).register_user()

    if user[0]:
        return jsonify({"success": True, "message": user[1]}), 200
    else:
        return jsonify({"success": False, "error": user[1]}), 400


@user_controller.route("/user/login/", methods=["POST"])
def login_user() -> tuple[dict, int]:
    """Iniciar sesion por DNI y contrasena (no choca con POST /login/ por email en auth)."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    email = data.get("email")
    password = data.get("password")
    result = User.authenticate(email, password)

    if not result[0]:
        code = 401 if result[1] == "Credenciales incorrectas" else 400
        return jsonify({"success": False, "error": result[1]}), code

    user = result[2]

    session["loggedin"] = True
    session["id"] = user["id"]
    session["dni"] = user["dni"]
    session["email"] = user["email"]
    session["role"] = user["role"]
    session["name"] = user["first_name"]
    session["lastName"] = user["last_name"]
    session["sig"] = user["id_school"]
    return (
        jsonify(
            {
                "success": True,
                "message": result[1],
                "user": {
                    "id": user["id"],
                    "dni": user["dni"],
                    "email": user["email"],
                    "role": user["role"],
                    "name": user["first_name"],
                    "lastName": user["last_name"],
                    "sig": user["id_school"],
                },
            }
        ),
        200,
    )


@user_controller.route("/get_user_by_dni/<dni>", methods=["GET"])
def get_user_by_dni(dni: str) -> tuple[dict, int]:
    """Obtener un usuario por su DNI"""
    if not dni:
        return jsonify({"error": "No se enviaron datos"}), 400

    result = User.get_user_by_dni(dni)

    if not result[0]:
        return jsonify({"success": False, "error": result[1]}), 404

    return jsonify({"success": True, "user": result[2]}), 200


@user_controller.route("/get_user_teachers/<sig>", methods=["GET"])
def get_user_teachers(sig):
    try:
        if not sig:
            return jsonify({"error": "Es necesario el SIG"}), 400

        result = User.get_teachers_all(sig)

        if not result[0]:
            return jsonify({"success": False, "error": result[1]}), 404

        return jsonify({"success": True, "teachers": result[2]}), 200

    except Exception as e:
        print(f"Ocurrio un error {e}")
        return jsonify({"error": str(e)}), 500
