from flask import Blueprint, session, jsonify

# Blueprint para el logout de usuarios
logout_bp = Blueprint("logout", __name__)


@logout_bp.route("/logout/")
def logout_user() -> tuple[dict, int]:
    """Logout de usuarios"""
    user_email = session.get("email")
    try:
        print(f"Sesión cerrada correctamente para el usuario: {user_email}")
        session.clear()
        return (
            jsonify({"success": True, "message": "Sesión cerrada correctamente"}),
            200,
        )
    except Exception as e:
        print(f"Error al cerrar sesión: {e}")
        return (
            jsonify({"success": False, "message": "Error al cerrar sesión"}),
            500,
        )
