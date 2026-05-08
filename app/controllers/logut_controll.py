from flask import jsonify, Blueprint, session

# Blueprint para el logout
logout_controller = Blueprint("logout_controller", __name__)


@logout_controller.route("/logout/", methods=["POST"])
def logout():
    """Cerrar sesión del usuario"""
    user_email = session.get("email", "Desconocido/Expirado")

    try:
        session.clear()

        print(f" LOGOUT: Sesión finalizada para {user_email}")

        return (
            jsonify({"success": True, "message": "Sesión cerrada correctamente"}),
            200,
        )

    except Exception as e:
        print(f" ERROR LOGOUT: {str(e)}")
        return jsonify({"error": "No se pudo cerrar la sesión"}), 500
