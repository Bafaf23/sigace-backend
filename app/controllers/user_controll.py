from flask import jsonify, Blueprint, request
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

    type_document = data.get("type_document")
    document = data.get("document")

    print(data)

    dni = f"{type_document} {document}"

    # Validacion de datos
    if not re.match(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", data.get("email")
    ):
        return jsonify({"error": "El email no es valido"}), 400
    if not re.match(r"^[0-9]{11}$", data.get("phone")):
        return jsonify({"error": "El telefono debe tener 8 digitos"}), 400

    user = User(
        dni=dni,
        first_name=data.get("name"),
        last_name=data.get("lastName"),
        email=data.get("email"),
        phone=data.get("phone"),
        birthdate=data.get("birthdate"),
        password=data.get("password"),
        role=data.get("role"),
        school_id=data.get("sig"),
    )

    if user.register_user():
        return (
            jsonify({"success": True, "message": "Usuario registrado correctamente"}),
            200,
        )
    else:
        return (
            jsonify({"success": False, "error": "Error al registrar el usuario"}),
            500,
        )


@user_controller.route("/login/", methods=["POST"])
def login_user() -> tuple[dict, int]:
    """Iniciar sesión de un usuario"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400
    user = User.get_user_by_dni(data.get("dni"))


@user_controller.route("/get_user_by_dni/", methods=["GET"])
def get_user_by_dni() -> tuple[dict, int]:
    """Obtener un usuario por su DNI"""
    dni = request.args.get("dni", "V-30021867")

    if not dni:
        return jsonify({"error": "No se enviaron datos"}), 400

    user = User.get_user_by_dni(dni)

    if user:
        return jsonify({"success": True, "user": user}), 200
    else:
        return jsonify({"success": False, "error": "Usuario no encontrado"}), 404


@user_controller.route("/get_user_teachers/<sig>", methods=["GET"])
def get_user_teachers(sig):
    try:
        print(sig)
        if not sig:
            return jsonify({"error": "Es necesariol el SIG"}), 400

        teachers = User.get_teachers_all(sig)

        if teachers:
            return jsonify({"success": True, "Teachers": [teachers]}), 200

    except Exception as e:
        print(f"Ocurrio un error {e}")
        return []
